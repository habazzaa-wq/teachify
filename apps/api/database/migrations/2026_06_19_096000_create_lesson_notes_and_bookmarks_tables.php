<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lesson_notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tenant_user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_section_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_lesson_id')->constrained('course_lessons')->cascadeOnDelete();
            $table->foreignId('media_asset_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedInteger('timestamp_seconds')->nullable();
            $table->string('title')->nullable();
            $table->text('body');
            $table->timestamps();

            $table->index(['tenant_id', 'tenant_user_id', 'course_lesson_id']);
            $table->foreign(['tenant_user_id', 'tenant_id'])
                ->references(['id', 'tenant_id'])
                ->on('tenant_users')
                ->cascadeOnDelete();
            $table->foreign(['course_lesson_id', 'course_section_id', 'course_id', 'tenant_id'], 'lesson_notes_lesson_hierarchy_fk')
                ->references(['id', 'course_section_id', 'course_id', 'tenant_id'])
                ->on('course_lessons')
                ->cascadeOnDelete();
        });

        Schema::create('lesson_bookmarks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tenant_user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_section_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_lesson_id')->constrained('course_lessons')->cascadeOnDelete();
            $table->foreignId('media_asset_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedInteger('timestamp_seconds')->nullable();
            $table->string('label')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'tenant_user_id', 'course_lesson_id']);
            $table->foreign(['tenant_user_id', 'tenant_id'])
                ->references(['id', 'tenant_id'])
                ->on('tenant_users')
                ->cascadeOnDelete();
            $table->foreign(['course_lesson_id', 'course_section_id', 'course_id', 'tenant_id'], 'lesson_bookmarks_lesson_hierarchy_fk')
                ->references(['id', 'course_section_id', 'course_id', 'tenant_id'])
                ->on('course_lessons')
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lesson_bookmarks');
        Schema::dropIfExists('lesson_notes');
    }
};
