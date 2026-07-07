<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('course_sections', function (Blueprint $table) {
            $table->string('slug')->nullable()->after('title');
            $table->unsignedInteger('duration_minutes')->nullable()->after('description');
            $table->boolean('free_preview')->default(false)->after('duration_minutes');
            $table->boolean('locked')->default(false)->after('free_preview');
            $table->boolean('featured')->default(false)->after('locked');
            $table->string('color', 20)->nullable()->after('featured');
            $table->string('icon', 100)->nullable()->after('color');
            $table->text('notes')->nullable()->after('icon');
            $table->softDeletes()->after('updated_at');
        });
    }

    public function down(): void
    {
        Schema::table('course_sections', function (Blueprint $table) {
            $table->dropColumn([
                'slug', 'duration_minutes', 'free_preview',
                'locked', 'featured', 'color', 'icon', 'notes',
            ]);
            $table->dropSoftDeletes();
        });
    }
};
