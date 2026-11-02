<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('courses', function (Blueprint $table): void {
            $table->json('regional_prices')->nullable();
        });

        Schema::table('wallet_payments', function (Blueprint $table): void {
            $table->foreignId('course_id')->nullable()->after('wallet_id')->constrained()->nullOnDelete();
            $table->string('payment_type', 32)->default('wallet_topup')->index();
            $table->foreignId('wallet_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('wallet_payments', function (Blueprint $table): void {
            $table->dropForeign(['course_id']);
            $table->dropIndex(['payment_type']);
            $table->dropColumn(['course_id', 'payment_type']);
            $table->foreignId('wallet_id')->nullable(false)->change();
        });

        Schema::table('courses', function (Blueprint $table): void {
            $table->dropColumn('regional_prices');
        });
    }
};
