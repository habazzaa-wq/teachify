<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lesson_files', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_section_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_lesson_id')->constrained('course_lessons')->cascadeOnDelete();
            $table->foreignId('media_asset_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->boolean('download_enabled')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['tenant_id', 'course_lesson_id', 'sort_order']);
            $table->foreign(['course_lesson_id', 'course_section_id', 'course_id', 'tenant_id'], 'lesson_files_lesson_hierarchy_fk')
                ->references(['id', 'course_section_id', 'course_id', 'tenant_id'])
                ->on('course_lessons')
                ->cascadeOnDelete();
            $table->foreign(['media_asset_id', 'tenant_id'])
                ->references(['id', 'tenant_id'])
                ->on('media_assets')
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lesson_files');
    }
};
