<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('question_imports', 'requested_mode')) return;
        Schema::table('question_imports', function (Blueprint $table) {
            $table->string('requested_mode')->default('auto')->after('status');
            $table->string('used_mode')->nullable()->after('requested_mode');
            $table->boolean('fallback_used')->default(false)->after('used_mode');
            $table->string('fallback_reason')->nullable()->after('fallback_used');
            $table->string('strategy')->nullable()->after('fallback_reason');
        });
    }

    public function down(): void
    {
        Schema::table('question_imports', function (Blueprint $table) {
            $table->dropColumn(['requested_mode', 'used_mode', 'fallback_used', 'fallback_reason', 'strategy']);
        });
    }
};
