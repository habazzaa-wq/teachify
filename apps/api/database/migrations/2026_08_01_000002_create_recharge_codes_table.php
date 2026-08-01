<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('recharge_codes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('created_by_tenant_user_id')->nullable()->constrained('tenant_users')->nullOnDelete();
            $table->string('code', 64);
            $table->decimal('amount', 12, 2)->default(0);
            $table->unsignedInteger('max_uses')->default(1);
            $table->unsignedInteger('used_count')->default(0);
            $table->timestamp('expires_at')->nullable();
            $table->boolean('is_active')->default(true)->index();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['tenant_id', 'code']);
            $table->unique(['id', 'tenant_id']);
            $table->index(['tenant_id', 'code', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('recharge_codes');
    }
};
