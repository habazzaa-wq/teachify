<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('certificate_applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_enrollment_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tenant_user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_certificate_rule_id')->nullable()->constrained('course_certificate_rules')->nullOnDelete();
            $table->foreignId('certificate_template_id')->nullable()->constrained('certificate_templates')->nullOnDelete();
            $table->foreignId('issued_certificate_id')->nullable()->constrained('issued_certificates')->nullOnDelete();
            $table->foreignId('reviewed_by_tenant_user_id')->nullable()->constrained('tenant_users')->nullOnDelete();
            $table->string('status')->default('pending')->index(); // pending, approved, rejected, issued, cancelled
            $table->unsignedTinyInteger('progress_percent_at_apply')->default(0);
            $table->timestamp('applied_at')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->text('student_note')->nullable();
            $table->text('admin_note')->nullable();
            $table->jsonb('metadata')->nullable();
            $table->timestamps();

            $table->unique(['id', 'tenant_id']);
            $table->index(['tenant_id', 'status', 'created_at'], 'cert_apps_tenant_status_created_idx');
            $table->index(['tenant_id', 'tenant_user_id', 'course_id'], 'cert_apps_tenant_student_course_idx');
            $table->foreign(['course_id', 'tenant_id'])
                ->references(['id', 'tenant_id'])
                ->on('courses')
                ->cascadeOnDelete();
            $table->foreign(['course_enrollment_id', 'course_id', 'tenant_id'], 'cert_apps_enrollment_fk')
                ->references(['id', 'course_id', 'tenant_id'])
                ->on('course_enrollments')
                ->cascadeOnDelete();
            $table->foreign(['tenant_user_id', 'tenant_id'], 'cert_apps_student_fk')
                ->references(['id', 'tenant_id'])
                ->on('tenant_users')
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('certificate_applications');
    }
};
