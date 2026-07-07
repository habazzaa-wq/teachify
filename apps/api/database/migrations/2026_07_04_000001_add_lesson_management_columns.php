<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('course_lessons', function (Blueprint $table) {
            $table->string('lesson_type', 20)->nullable()->index()->after('type');
            $table->text('short_description')->nullable()->after('slug');
            $table->longText('description')->nullable()->after('short_description');
            $table->unsignedInteger('estimated_duration')->nullable()->after('duration_seconds');
            $table->boolean('free_preview')->default(false)->after('visibility');
            $table->boolean('downloadable')->default(false)->after('free_preview');
            $table->boolean('featured')->default(false)->after('downloadable');
            $table->boolean('comments_enabled')->default(true)->after('featured');
            $table->text('notes')->nullable()->after('comments_enabled');
            $table->string('color', 20)->nullable()->after('notes');
            $table->string('icon')->nullable()->after('color');
            $table->timestamp('published_at')->nullable()->after('icon');
            $table->softDeletes();

            $table->unique(['tenant_id', 'course_section_id', 'slug'], 'course_lessons_section_slug_unique');
            $table->index(['tenant_id', 'status']);
            $table->index(['tenant_id', 'visibility']);
            $table->index(['tenant_id', 'lesson_type']);
            $table->index(['tenant_id', 'free_preview']);
            $table->index(['tenant_id', 'featured']);
        });
    }

    public function down(): void
    {
        Schema::table('course_lessons', function (Blueprint $table) {
            $table->dropColumn([
                'short_description', 'description', 'estimated_duration',
                'free_preview', 'downloadable', 'featured', 'comments_enabled',
                'notes', 'color', 'icon', 'published_at',
            ]);
            $table->dropSoftDeletes();
            $table->dropUnique('course_lessons_section_slug_unique');
            $table->unique(['tenant_id', 'course_id', 'slug']);
            $table->dropIndex(['tenant_id', 'status']);
            $table->dropIndex(['tenant_id', 'visibility']);
            $table->dropIndex(['tenant_id', 'lesson_type']);
            $table->dropIndex(['tenant_id', 'free_preview']);
            $table->dropIndex(['tenant_id', 'featured']);
        });
    }
};
