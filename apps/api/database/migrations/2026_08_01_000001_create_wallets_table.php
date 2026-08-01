<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('wallets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tenant_user_id')->constrained('tenant_users')->cascadeOnDelete();
            $table->decimal('balance', 12, 2)->default(0);
            $table->string('currency', 8)->default('EGP');
            $table->timestamps();

            $table->unique(['tenant_id', 'tenant_user_id']);
            $table->unique(['id', 'tenant_id']);
            $table->index(['tenant_id', 'tenant_user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wallets');
    }
};
