<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('community_message_attachments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('message_id');
            $table->foreignId('media_asset_id')->nullable();
            $table->string('type')->default('file')->index();
            $table->string('file_name');
            $table->string('mime_type')->nullable();
            $table->bigInteger('size_bytes')->nullable();
            $table->integer('duration_seconds')->nullable();
            $table->string('url')->nullable();
            $table->jsonb('metadata')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['tenant_id', 'message_id']);
            $table->foreign(['message_id', 'tenant_id'])
                ->references(['id', 'tenant_id'])
                ->on('community_messages')
                ->cascadeOnDelete();
            $table->foreign(['media_asset_id', 'tenant_id'])
                ->references(['id', 'tenant_id'])
                ->on('media_assets')
                ->nullOnDelete();
        });

        Schema::create('community_message_reactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('message_id');
            $table->foreignId('tenant_user_id');
            $table->string('emoji', 32);
            $table->timestamps();

            $table->unique(['tenant_id', 'message_id', 'tenant_user_id', 'emoji'], 'community_reactions_unique');
            $table->index(['tenant_id', 'message_id']);
            $table->foreign(['message_id', 'tenant_id'])
                ->references(['id', 'tenant_id'])
                ->on('community_messages')
                ->cascadeOnDelete();
            $table->foreign(['tenant_user_id', 'tenant_id'])
                ->references(['id', 'tenant_id'])
                ->on('tenant_users')
                ->cascadeOnDelete();
        });

        Schema::create('community_message_mentions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('message_id');
            $table->foreignId('mentioned_tenant_user_id');
            $table->timestamp('read_at')->nullable();
            $table->timestamps();

            $table->unique(['tenant_id', 'message_id', 'mentioned_tenant_user_id'], 'community_mentions_unique');
            $table->index(['tenant_id', 'mentioned_tenant_user_id']);
            $table->foreign(['message_id', 'tenant_id'])
                ->references(['id', 'tenant_id'])
                ->on('community_messages')
                ->cascadeOnDelete();
            $table->foreign(['mentioned_tenant_user_id', 'tenant_id'])
                ->references(['id', 'tenant_id'])
                ->on('tenant_users')
                ->cascadeOnDelete();
        });

        Schema::create('community_bookmarks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tenant_user_id');
            $table->foreignId('message_id');
            $table->text('note')->nullable();
            $table->timestamps();

            $table->unique(['tenant_id', 'tenant_user_id', 'message_id'], 'community_bookmarks_unique');
            $table->foreign(['message_id', 'tenant_id'])
                ->references(['id', 'tenant_id'])
                ->on('community_messages')
                ->cascadeOnDelete();
            $table->foreign(['tenant_user_id', 'tenant_id'])
                ->references(['id', 'tenant_id'])
                ->on('tenant_users')
                ->cascadeOnDelete();
        });

        Schema::create('community_follows', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tenant_user_id');
            $table->foreignId('channel_id')->nullable();
            $table->foreignId('thread_id')->nullable();
            $table->boolean('muted')->default(false);
            $table->timestamps();

            $table->unique(['tenant_id', 'tenant_user_id', 'channel_id', 'thread_id'], 'community_follows_unique');
            $table->foreign(['tenant_user_id', 'tenant_id'])
                ->references(['id', 'tenant_id'])
                ->on('tenant_users')
                ->cascadeOnDelete();
        });

        Schema::create('community_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('message_id');
            $table->foreignId('reported_by_tenant_user_id');
            $table->string('reason');
            $table->text('note')->nullable();
            $table->string('status')->default('pending')->index();
            $table->foreignId('reviewed_by_tenant_user_id')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->jsonb('metadata')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'status']);
            $table->foreign(['message_id', 'tenant_id'])
                ->references(['id', 'tenant_id'])
                ->on('community_messages')
                ->cascadeOnDelete();
            $table->foreign(['reported_by_tenant_user_id', 'tenant_id'])
                ->references(['id', 'tenant_id'])
                ->on('tenant_users')
                ->cascadeOnDelete();
            $table->foreign('reviewed_by_tenant_user_id')
                ->references('id')
                ->on('tenant_users')
                ->nullOnDelete();
        });

        Schema::create('community_moderation_actions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('subject_tenant_user_id');
            $table->foreignId('moderator_tenant_user_id');
            $table->string('action')->index();
            $table->foreignId('channel_id')->nullable();
            $table->foreignId('message_id')->nullable();
            $table->string('reason')->nullable();
            $table->integer('duration_minutes')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->jsonb('metadata')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'subject_tenant_user_id']);
            $table->index(['tenant_id', 'action']);
            $table->foreign(['subject_tenant_user_id', 'tenant_id'])
                ->references(['id', 'tenant_id'])
                ->on('tenant_users')
                ->cascadeOnDelete();
            $table->foreign(['moderator_tenant_user_id', 'tenant_id'])
                ->references(['id', 'tenant_id'])
                ->on('tenant_users')
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('community_moderation_actions');
        Schema::dropIfExists('community_reports');
        Schema::dropIfExists('community_follows');
        Schema::dropIfExists('community_bookmarks');
        Schema::dropIfExists('community_message_mentions');
        Schema::dropIfExists('community_message_reactions');
        Schema::dropIfExists('community_message_attachments');
    }
};
