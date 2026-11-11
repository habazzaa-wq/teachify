<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('wallet_payments', function (Blueprint $table): void {
            $table->text('provider_payment_url')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('wallet_payments', function (Blueprint $table): void {
            $table->string('provider_payment_url', 500)->nullable()->change();
        });
    }
};
