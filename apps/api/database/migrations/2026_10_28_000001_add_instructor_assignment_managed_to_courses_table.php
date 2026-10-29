<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('courses', function (Blueprint $table) {
            $table->boolean('instructor_assignment_managed')->default(false);
        });
    }

    public function down(): void
    {
        // Dropping this marker restores legacy creator/pivot authorization when the feature is disabled.
        Schema::table('courses', function (Blueprint $table) {
            $table->dropColumn('instructor_assignment_managed');
        });
    }
};
