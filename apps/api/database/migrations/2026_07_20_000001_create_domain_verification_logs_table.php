<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('domain_verification_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_domain_id')->constrained()->cascadeOnDelete();
            $table->string('action')->index();
            $table->string('status')->index();
            $table->text('message')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('domain_verification_logs');
    }
};
