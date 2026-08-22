<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('question_imports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('created_by_tenant_user_id')->nullable();
            $table->uuid('uuid')->unique();
            // pending: file stored, job not started.
            // processing: job running (stages recorded in `stages`).
            // ready: document extracted, awaiting teacher finalization.
            // failed: processing error (`error` populated).
            // consumed: finalized into a question; source file deleted.
            // expired: purged by the cleanup command.
            $table->string('status')->default('pending')->index();
            $table->json('source')->nullable();
            $table->json('stages')->nullable();
            $table->json('document')->nullable();
            $table->json('error')->nullable();
            $table->unsignedInteger('attempts')->default(0);
            $table->timestamp('processing_started_at')->nullable();
            $table->timestamp('finished_at')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'status']);
            $table->index(['tenant_id', 'created_by_tenant_user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('question_imports');
    }
};
