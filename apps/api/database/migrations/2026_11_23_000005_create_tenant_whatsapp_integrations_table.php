<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tenant_whatsapp_integrations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('provider')->default('meta_whatsapp_cloud_api');
            $table->boolean('is_enabled')->default(false)->index();
            $table->text('phone_number_id')->nullable();
            $table->text('business_account_id')->nullable();
            $table->text('access_token_encrypted')->nullable();
            $table->text('webhook_verify_token_encrypted')->nullable();
            $table->text('app_secret_encrypted')->nullable();
            $table->string('sender_display_phone')->nullable();
            $table->string('status')->default('inactive')->index();
            $table->timestamp('last_verified_at')->nullable();
            $table->jsonb('metadata')->nullable();
            $table->timestamps();

            $table->unique('tenant_id');
            $table->unique(['id', 'tenant_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenant_whatsapp_integrations');
    }
};
