<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('wallet_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('wallet_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tenant_user_id')->constrained('tenant_users')->cascadeOnDelete();
            $table->string('reference', 40)->unique();
            $table->decimal('amount', 12, 2)->default(0);
            $table->string('currency', 8)->default('EGP');
            $table->string('status', 20)->default('pending')->index();
            $table->string('provider', 20)->default('fawaterk');
            $table->string('provider_invoice_id', 40)->nullable();
            $table->string('provider_invoice_key', 64)->nullable();
            $table->string('provider_payment_url', 500)->nullable();
            $table->string('provider_reference', 64)->nullable();
            $table->string('failure_reason', 500)->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();

            $table->unique(['id', 'tenant_id']);
            $table->index(['tenant_id', 'status']);
            $table->index(['provider_invoice_id']);
            $table->index(['provider_reference']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wallet_payments');
    }
};
