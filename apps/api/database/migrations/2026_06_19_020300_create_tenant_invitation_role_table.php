<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tenant_invitation_role', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tenant_invitation_id')->constrained()->cascadeOnDelete();
            $table->foreignId('role_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['tenant_invitation_id', 'role_id']);
            $table->foreign(['tenant_invitation_id', 'tenant_id'])
                ->references(['id', 'tenant_id'])
                ->on('tenant_invitations')
                ->cascadeOnDelete();
            $table->foreign(['role_id', 'tenant_id'])
                ->references(['id', 'tenant_id'])
                ->on('roles')
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenant_invitation_role');
    }
};
