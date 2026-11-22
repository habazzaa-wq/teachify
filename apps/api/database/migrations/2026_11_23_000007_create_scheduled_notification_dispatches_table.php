<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('scheduled_notification_dispatches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_session_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tenant_user_id')->constrained('tenant_users')->cascadeOnDelete();
            $table->string('reminder_type');
            $table->timestamp('scheduled_for_utc');
            $table->timestamp('session_starts_at_utc_snapshot')->nullable();
            $table->string('status')->default('pending')->index();
            $table->string('cancelled_reason')->nullable();
            $table->timestamp('dispatched_at')->nullable();
            $table->string('dedupe_key');
            $table->jsonb('metadata')->nullable();
            $table->timestamps();

            $table->unique(['id', 'tenant_id']);
            $table->unique(['tenant_id', 'dedupe_key'], 'scheduled_notification_dispatches_tenant_dedupe_unique');
            $table->index(['tenant_id', 'status', 'scheduled_for_utc'], 'scheduled_notification_dispatches_due_idx');
            $table->index(['tenant_id', 'course_session_id', 'reminder_type'], 'scheduled_notification_dispatches_session_type_idx');
            $table->foreign(['course_session_id', 'tenant_id'], 'scheduled_notification_dispatches_session_fk')
                ->references(['id', 'tenant_id'])
                ->on('course_sessions')
                ->cascadeOnDelete();
            $table->foreign(['tenant_user_id', 'tenant_id'], 'scheduled_notification_dispatches_user_fk')
                ->references(['id', 'tenant_id'])
                ->on('tenant_users')
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('scheduled_notification_dispatches');
    }
};
