<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('community_xp_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tenant_user_id');
            $table->string('action_type')->index();
            $table->integer('xp');
            $table->foreignId('message_id')->nullable();
            $table->jsonb('metadata')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'tenant_user_id', 'created_at']);
            $table->index(['tenant_id', 'created_at']);
            $table->foreign(['tenant_user_id', 'tenant_id'])
                ->references(['id', 'tenant_id'])
                ->on('tenant_users')
                ->cascadeOnDelete();
        });

        Schema::create('community_presence', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tenant_user_id');
            $table->string('status')->default('offline')->index();
            $table->foreignId('current_channel_id')->nullable();
            $table->timestamp('last_seen_at')->nullable();
            $table->timestamps();

            $table->unique(['tenant_id', 'tenant_user_id']);
            $table->foreign(['tenant_user_id', 'tenant_id'])
                ->references(['id', 'tenant_id'])
                ->on('tenant_users')
                ->cascadeOnDelete();
        });

        Schema::create('community_announcements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('channel_id');
            $table->foreignId('created_by_tenant_user_id');
            $table->string('title');
            $table->text('body');
            $table->timestamp('scheduled_at')->nullable()->index();
            $table->timestamp('published_at')->nullable();
            $table->string('status')->default('draft')->index();
            $table->jsonb('metadata')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign(['channel_id', 'tenant_id'])
                ->references(['id', 'tenant_id'])
                ->on('community_channels')
                ->cascadeOnDelete();
            $table->foreign(['created_by_tenant_user_id', 'tenant_id'], 'community_announcements_creator_foreign')
                ->references(['id', 'tenant_id'])
                ->on('tenant_users')
                ->cascadeOnDelete();
        });

        Schema::create('community_stats', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('key')->index();
            $table->bigInteger('value')->nullable();
            $table->jsonb('payload')->nullable();
            $table->timestamp('updated_at')->nullable();

            $table->unique(['tenant_id', 'key']);
        });

        Schema::create('community_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->boolean('is_enabled')->default(true);
            $table->boolean('exam_protection_enabled')->default(true);
            $table->boolean('xp_enabled')->default(true);
            $table->boolean('profanity_filter_enabled')->default(true);
            $table->boolean('auto_moderation_enabled')->default(true);
            $table->integer('message_cooldown_seconds')->default(5);
            $table->integer('flood_limit')->default(5);
            $table->integer('flood_window_seconds')->default(10);
            $table->integer('edit_window_minutes')->default(5);
            $table->integer('duplicate_window_seconds')->default(30);
            $table->integer('attachment_max_mb')->default(25);
            $table->jsonb('allowed_attachment_types')->nullable();
            $table->jsonb('config')->nullable();
            $table->timestamps();

            $table->unique(['tenant_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('community_settings');
        Schema::dropIfExists('community_stats');
        Schema::dropIfExists('community_announcements');
        Schema::dropIfExists('community_presence');
        Schema::dropIfExists('community_xp_events');
    }
};
