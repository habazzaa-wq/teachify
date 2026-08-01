<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // A student can redeem a given code only once (DB-level guarantee).
        Schema::table('wallet_transactions', function (Blueprint $table) {
            $table->unique(['tenant_user_id', 'recharge_code_id'], 'wallet_transactions_student_code_unique');
        });
    }

    public function down(): void
    {
        Schema::table('wallet_transactions', function (Blueprint $table) {
            $table->dropUnique('wallet_transactions_student_code_unique');
        });
    }
};
