<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('course_lessons', function (Blueprint $table) {
            $table->unique(['id', 'course_id', 'tenant_id'], 'course_lessons_course_tenant_unique');
        });

        Schema::create('course_access_rules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->string('access_mode')->default('private')->index();
            $table->boolean('requires_approval')->default(false);
            $table->boolean('allow_self_enrollment')->default(false);
            $table->boolean('invite_only')->default(false);
            $table->jsonb('metadata')->nullable();
            $table->timestamps();

            $table->unique(['tenant_id', 'course_id']);
            $table->foreign(['course_id', 'tenant_id'])
                ->references(['id', 'tenant_id'])
                ->on('courses')
                ->cascadeOnDelete();
        });

        Schema::create('lesson_access_rules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_lesson_id')->constrained()->cascadeOnDelete();
            $table->string('access_mode')->default('inherit_course')->index();
            $table->timestamp('available_from')->nullable();
            $table->timestamp('available_until')->nullable();
            $table->unsignedBigInteger('prerequisite_lesson_id')->nullable();
            $table->jsonb('metadata')->nullable();
            $table->timestamps();

            $table->unique(['tenant_id', 'course_lesson_id']);
            $table->foreign(['course_id', 'tenant_id'])
                ->references(['id', 'tenant_id'])
                ->on('courses')
                ->cascadeOnDelete();
            $table->foreign(['course_lesson_id', 'course_id', 'tenant_id'])
                ->references(['id', 'course_id', 'tenant_id'])
                ->on('course_lessons')
                ->cascadeOnDelete();
            $table->foreign('prerequisite_lesson_id')
                ->references('id')
                ->on('course_lessons')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lesson_access_rules');
        Schema::dropIfExists('course_access_rules');

        Schema::table('course_lessons', function (Blueprint $table) {
            $table->dropUnique('course_lessons_course_tenant_unique');
        });
    }
};
