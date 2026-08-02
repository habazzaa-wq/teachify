<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exam_anti_cheat_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('exam_attempt_id')->constrained()->cascadeOnDelete();
            $table->string('event_type', 64);
            $table->timestamp('occurred_at');
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'exam_attempt_id', 'occurred_at']);
            $table->index(['tenant_id', 'event_type', 'occurred_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exam_anti_cheat_events');
    }
};
