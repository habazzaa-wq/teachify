<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('courses', function (Blueprint $table) {
            $table->foreignId('educational_stage_id')->nullable()->after('primary_instructor_tenant_user_id')
                ->constrained('educational_stages')->nullOnDelete();
            $table->foreignId('subject_id')->nullable()->after('educational_stage_id')
                ->constrained('subjects')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('courses', function (Blueprint $table) {
            $table->dropForeign(['educational_stage_id']);
            $table->dropForeign(['subject_id']);
            $table->dropColumn(['educational_stage_id', 'subject_id']);
        });
    }
};
