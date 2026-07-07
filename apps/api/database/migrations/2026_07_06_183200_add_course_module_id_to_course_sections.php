<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('course_sections', function (Blueprint $table) {
            $table->foreignId('course_module_id')
                ->nullable()
                ->after('course_id')
                ->constrained('course_modules')
                ->cascadeOnDelete();
        });

        $courses = DB::table('courses')
            ->whereExists(function ($query): void {
                $query->select(DB::raw(1))
                    ->from('course_sections')
                    ->whereColumn('course_sections.course_id', 'courses.id')
                    ->whereNull('course_sections.course_module_id');
            })
            ->get(['id', 'tenant_id']);

        foreach ($courses as $course) {
            $moduleId = DB::table('course_modules')->insertGetId([
                'tenant_id' => $course->tenant_id,
                'course_id' => $course->id,
                'title' => 'محتوى الكورس',
                'slug' => 'default',
                'description' => null,
                'order' => 0,
                'status' => 'published',
                'is_published' => true,
                'featured' => false,
                'estimated_duration' => null,
                'color' => null,
                'icon' => null,
                'notes' => null,
                'published_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::table('course_sections')
                ->where('course_id', $course->id)
                ->whereNull('course_module_id')
                ->update(['course_module_id' => $moduleId]);
        }

        if (app()->environment('testing')) {
            return;
        }

        Schema::table('course_sections', function (Blueprint $table) {
            $table->foreignId('course_module_id')->nullable(false)->change();
        });
    }

    public function down(): void
    {
        Schema::table('course_sections', function (Blueprint $table) {
            $table->dropConstrainedForeignId('course_module_id');
        });
    }
};
