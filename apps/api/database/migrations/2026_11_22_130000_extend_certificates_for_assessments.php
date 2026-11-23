<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('course_certificate_rules', function (Blueprint $table) {
            $table->boolean('show_instructor_signature')->default(false)->after('minimum_completion_percentage');
            $table->string('manager_signature_name')->nullable()->after('show_instructor_signature');
            $table->string('manager_signature_title')->nullable()->after('manager_signature_name');
            $table->string('manager_signature_url')->nullable()->after('manager_signature_title');
            $table->string('instructor_signature_url')->nullable()->after('manager_signature_url');
        });

        Schema::create('course_certificate_requirements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_certificate_rule_id')->nullable()->constrained('course_certificate_rules')->cascadeOnDelete();
            $table->foreignId('exam_id')->nullable()->constrained('exams')->nullOnDelete();
            $table->string('type', 32)->index(); // exam_bank, exam_link, project
            $table->string('title')->nullable();
            $table->text('description')->nullable();
            $table->string('exam_link')->nullable();
            $table->unsignedTinyInteger('required_score')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['tenant_id', 'course_id'], 'cert_req_tenant_course_idx');
            $table->foreign(['course_id', 'tenant_id'])
                ->references(['id', 'tenant_id'])
                ->on('courses')
                ->cascadeOnDelete();
        });

        Schema::table('issued_certificates', function (Blueprint $table) {
            $table->foreignId('course_enrollment_id')->nullable()->constrained('course_enrollments')->nullOnDelete()->after('course_completion_id');
            $table->string('reference_number')->nullable()->unique()->after('certificate_number');
            $table->boolean('show_instructor_signature')->default(false)->after('reference_number');
            $table->jsonb('snapshot_data')->nullable()->after('metadata');
            $table->index(['course_id', 'tenant_user_id'], 'issued_cert_course_student_idx');
        });

        Schema::table('certificate_applications', function (Blueprint $table) {
            $table->jsonb('submissions')->nullable()->after('student_note');
            $table->jsonb('requirement_reviews')->nullable()->after('submissions');
        });
    }

    public function down(): void
    {
        Schema::table('certificate_applications', function (Blueprint $table) {
            $table->dropColumn(['submissions', 'requirement_reviews']);
        });

        Schema::table('issued_certificates', function (Blueprint $table) {
            $table->dropIndex('issued_cert_course_student_idx');
            $table->dropColumn(['course_enrollment_id', 'reference_number', 'show_instructor_signature', 'snapshot_data']);
        });

        Schema::dropIfExists('course_certificate_requirements');

        Schema::table('course_certificate_rules', function (Blueprint $table) {
            $table->dropColumn([
                'show_instructor_signature',
                'manager_signature_name',
                'manager_signature_title',
                'manager_signature_url',
                'instructor_signature_url',
            ]);
        });
    }
};
