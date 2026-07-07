<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('course_lessons', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_section_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->string('slug');
            $table->string('type')->index();
            $table->string('status')->default('draft')->index();
            $table->string('visibility')->default('private')->index();
            $table->unsignedInteger('sort_order')->default(0);
            $table->unsignedInteger('duration_seconds')->nullable();
            $table->timestamps();

            $table->unique(['tenant_id', 'course_id', 'slug']);
            $table->unique(['id', 'tenant_id']);
            $table->unique(['id', 'course_section_id', 'course_id', 'tenant_id'], 'course_lessons_hierarchy_unique');
            $table->index(['tenant_id', 'course_id', 'course_section_id', 'sort_order'], 'course_lessons_scope_order_index');
            $table->foreign(['course_id', 'tenant_id'])
                ->references(['id', 'tenant_id'])
                ->on('courses')
                ->cascadeOnDelete();
            $table->foreign(['course_section_id', 'course_id', 'tenant_id'])
                ->references(['id', 'course_id', 'tenant_id'])
                ->on('course_sections')
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('course_lessons');
    }
};
