<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('certificate_templates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('slug');
            $table->string('status')->default('draft')->index();
            $table->jsonb('template_data');
            $table->timestamps();

            $table->unique(['tenant_id', 'slug']);
            $table->unique(['id', 'tenant_id']);
        });

        Schema::create('course_certificate_rules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->foreignId('certificate_template_id')->nullable()->constrained('certificate_templates')->nullOnDelete();
            $table->boolean('enabled')->default(false);
            $table->boolean('require_course_completion')->default(true);
            $table->boolean('require_quiz_pass')->default(false);
            $table->boolean('require_assignment_pass')->default(false);
            $table->unsignedTinyInteger('minimum_completion_percentage')->default(100);
            $table->timestamps();

            $table->unique(['tenant_id', 'course_id']);
            $table->foreign(['course_id', 'tenant_id'])
                ->references(['id', 'tenant_id'])
                ->on('courses')
                ->cascadeOnDelete();
        });

        Schema::create('issued_certificates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_completion_id')->nullable()->constrained('course_completions')->nullOnDelete();
            $table->foreignId('tenant_user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('certificate_template_id')->constrained('certificate_templates')->restrictOnDelete();
            $table->string('certificate_number');
            $table->timestamp('issued_at');
            $table->string('status')->default('issued')->index();
            $table->jsonb('metadata');
            $table->timestamps();

            $table->unique('certificate_number');
            $table->unique(['tenant_id', 'course_id', 'tenant_user_id']);
            $table->unique(['id', 'tenant_id']);
            $table->foreign(['course_id', 'tenant_id'])
                ->references(['id', 'tenant_id'])
                ->on('courses')
                ->cascadeOnDelete();
            $table->foreign(['tenant_user_id', 'tenant_id'])
                ->references(['id', 'tenant_id'])
                ->on('tenant_users')
                ->cascadeOnDelete();
            $table->foreign(['certificate_template_id', 'tenant_id'])
                ->references(['id', 'tenant_id'])
                ->on('certificate_templates')
                ->restrictOnDelete();
        });

        Schema::create('certificate_verifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('issued_certificate_id')->constrained()->cascadeOnDelete();
            $table->string('verification_code');
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();

            $table->unique('verification_code');
            $table->unique(['tenant_id', 'issued_certificate_id']);
            $table->foreign(['issued_certificate_id', 'tenant_id'], 'cert_verifications_issued_fk')
                ->references(['id', 'tenant_id'])
                ->on('issued_certificates')
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('certificate_verifications');
        Schema::dropIfExists('issued_certificates');
        Schema::dropIfExists('course_certificate_rules');
        Schema::dropIfExists('certificate_templates');
    }
};
