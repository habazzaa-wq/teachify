<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('course_lessons', function (Blueprint $table) {
            $table->unsignedBigInteger('exam_id')->nullable()->after('icon');
            $table->index(['tenant_id', 'exam_id']);
        });
    }

    public function down(): void
    {
        Schema::table('course_lessons', function (Blueprint $table) {
            $table->dropIndex(['tenant_id', 'exam_id']);
            $table->dropColumn('exam_id');
        });
    }
};
