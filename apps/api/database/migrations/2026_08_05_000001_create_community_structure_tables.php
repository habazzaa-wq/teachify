<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('community_categories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('slug');
            $table->string('name');
            $table->string('description')->nullable();
            $table->string('icon')->nullable();
            $table->integer('sort_order')->default(0);
            $table->boolean('is_default')->default(false);
            $table->boolean('allows_questions')->default(false);
            $table->boolean('moderator_only')->default(false);
            $table->string('status')->default('active')->index();
            $table->foreignId('created_by_tenant_user_id')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['tenant_id', 'slug']);
            $table->unique(['id', 'tenant_id']);
            $table->index(['tenant_id', 'status', 'sort_order']);
        });

        Schema::create('community_channels', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('category_id');
            $table->string('slug');
            $table->string('name');
            $table->string('description')->nullable();
            $table->string('type')->default('general')->index();
            $table->integer('sort_order')->default(0);
            $table->string('status')->default('active')->index();
            $table->boolean('is_locked')->default(false)->index();
            $table->boolean('is_pinned')->default(false)->index();
            $table->boolean('allows_questions')->default(false);
            $table->foreignId('last_message_id')->nullable();
            $table->timestamp('last_message_at')->nullable()->index();
            $table->foreignId('created_by_tenant_user_id')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['tenant_id', 'slug']);
            $table->unique(['id', 'tenant_id']);
            $table->index(['tenant_id', 'category_id', 'status']);
            $table->foreign(['category_id', 'tenant_id'])
                ->references(['id', 'tenant_id'])
                ->on('community_categories')
                ->cascadeOnDelete();
        });

        Schema::create('community_threads', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('channel_id');
            $table->string('title');
            $table->foreignId('created_by_tenant_user_id');
            $table->string('status')->default('active')->index();
            $table->boolean('is_pinned')->default(false)->index();
            $table->boolean('is_locked')->default(false);
            $table->timestamp('last_message_at')->nullable()->index();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['id', 'tenant_id']);
            $table->index(['tenant_id', 'channel_id', 'last_message_at']);
            $table->foreign(['channel_id', 'tenant_id'])
                ->references(['id', 'tenant_id'])
                ->on('community_channels')
                ->cascadeOnDelete();
            $table->foreign(['created_by_tenant_user_id', 'tenant_id'])
                ->references(['id', 'tenant_id'])
                ->on('tenant_users')
                ->cascadeOnDelete();
        });

        Schema::create('community_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('channel_id');
            $table->foreignId('thread_id')->nullable();
            $table->foreignId('parent_message_id')->nullable();
            $table->foreignId('reply_to_message_id')->nullable();
            $table->foreignId('tenant_user_id');
            $table->text('body');
            $table->text('body_text');
            $table->string('content_type')->default('text')->index();
            $table->string('status')->default('active')->index();
            $table->boolean('is_pinned')->default(false)->index();
            $table->boolean('is_announcement')->default(false)->index();
            $table->boolean('is_official_answer')->default(false)->index();
            $table->boolean('is_highlighted')->default(false);
            $table->boolean('is_solved')->default(false)->index();
            $table->jsonb('metadata')->nullable();
            $table->timestamp('edited_at')->nullable();
            $table->timestamp('deleted_at')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'channel_id', 'id']);
            $table->index(['tenant_id', 'thread_id', 'id']);
            $table->index(['tenant_id', 'tenant_user_id']);
            $table->index(['tenant_id', 'channel_id', 'is_pinned']);
            $table->unique(['id', 'tenant_id']);
            $table->foreign(['channel_id', 'tenant_id'])
                ->references(['id', 'tenant_id'])
                ->on('community_channels')
                ->cascadeOnDelete();
            $table->foreign(['thread_id', 'tenant_id'])
                ->references(['id', 'tenant_id'])
                ->on('community_threads')
                ->cascadeOnDelete();
            $table->foreign(['tenant_user_id', 'tenant_id'])
                ->references(['id', 'tenant_id'])
                ->on('tenant_users')
                ->cascadeOnDelete();
        });

        Schema::table('community_messages', function (Blueprint $table) {
            // Self-referential FKs reference the single primary key to remain
            // compatible with SQLite test databases; tenant isolation is still
            // enforced by the BelongsToTenant trait and tenant_id scoping.
            $table->foreign('parent_message_id')
                ->references('id')
                ->on('community_messages')
                ->cascadeOnDelete();
            $table->foreign('reply_to_message_id')
                ->references('id')
                ->on('community_messages')
                ->nullOnDelete();
        });

        Schema::create('community_participants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tenant_user_id');
            $table->string('role')->default('member')->index();
            $table->string('status')->default('active')->index();
            $table->timestamp('joined_at')->nullable();
            $table->timestamp('muted_until')->nullable();
            $table->string('muted_reason')->nullable();
            $table->timestamp('banned_until')->nullable();
            $table->string('banned_reason')->nullable();
            $table->jsonb('notification_prefs')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['tenant_id', 'tenant_user_id']);
            $table->foreign(['tenant_user_id', 'tenant_id'])
                ->references(['id', 'tenant_id'])
                ->on('tenant_users')
                ->cascadeOnDelete();
        });

        Schema::create('community_read_receipts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('channel_id');
            $table->foreignId('thread_id')->nullable();
            $table->foreignId('tenant_user_id');
            $table->foreignId('last_read_message_id')->nullable();
            $table->timestamp('last_read_at')->nullable();
            $table->timestamps();

            $table->unique(['tenant_id', 'tenant_user_id', 'channel_id', 'thread_id'], 'community_read_receipts_unique');
            $table->foreign(['channel_id', 'tenant_id'])
                ->references(['id', 'tenant_id'])
                ->on('community_channels')
                ->cascadeOnDelete();
            $table->foreign(['tenant_user_id', 'tenant_id'])
                ->references(['id', 'tenant_id'])
                ->on('tenant_users')
                ->cascadeOnDelete();
            $table->foreign('last_read_message_id')
                ->references('id')
                ->on('community_messages')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('community_read_receipts');
        Schema::dropIfExists('community_participants');
        Schema::dropIfExists('community_messages');
        Schema::dropIfExists('community_threads');
        Schema::dropIfExists('community_channels');
        Schema::dropIfExists('community_categories');
    }
};
