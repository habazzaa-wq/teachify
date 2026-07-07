<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('discussion_threads', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('created_by_tenant_user_id');
            $table->foreignId('course_id')->nullable();
            $table->foreignId('course_section_id')->nullable();
            $table->foreignId('course_lesson_id')->nullable();
            $table->string('title');
            $table->string('type')->index();
            $table->string('status')->default('active')->index();
            $table->boolean('is_pinned')->default(false)->index();
            $table->boolean('is_locked')->default(false)->index();
            $table->timestamp('last_activity_at')->nullable()->index();
            $table->jsonb('metadata');
            $table->timestamps();

            $table->index(['tenant_id', 'course_id']);
            $table->index(['tenant_id', 'course_lesson_id']);
            $table->index(['tenant_id', 'created_by_tenant_user_id']);
            $table->unique(['id', 'tenant_id']);
            $table->foreign(['created_by_tenant_user_id', 'tenant_id'])
                ->references(['id', 'tenant_id'])
                ->on('tenant_users')
                ->cascadeOnDelete();
        });

        Schema::table('discussion_threads', function (Blueprint $table) {
            $table->foreign(['course_id', 'tenant_id'])
                ->references(['id', 'tenant_id'])
                ->on('courses')
                ->cascadeOnDelete();
            $table->foreign('course_section_id')
                ->references('id')
                ->on('course_sections')
                ->nullOnDelete();
            $table->foreign(['course_lesson_id', 'tenant_id'])
                ->references(['id', 'tenant_id'])
                ->on('course_lessons')
                ->cascadeOnDelete();
        });

        Schema::create('discussion_posts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('discussion_thread_id');
            $table->foreignId('tenant_user_id');
            $table->foreignId('parent_post_id')->nullable();
            $table->text('body');
            $table->string('status')->default('active')->index();
            $table->timestamp('edited_at')->nullable();
            $table->timestamp('deleted_at')->nullable();
            $table->jsonb('metadata');
            $table->timestamps();

            $table->index(['tenant_id', 'discussion_thread_id']);
            $table->index(['tenant_id', 'tenant_user_id']);
            $table->unique(['id', 'tenant_id']);
            $table->foreign(['discussion_thread_id', 'tenant_id'])
                ->references(['id', 'tenant_id'])
                ->on('discussion_threads')
                ->cascadeOnDelete();
            $table->foreign(['tenant_user_id', 'tenant_id'])
                ->references(['id', 'tenant_id'])
                ->on('tenant_users')
                ->cascadeOnDelete();
        });

        Schema::table('discussion_posts', function (Blueprint $table) {
            // Self-referential FK references the single primary key to remain
            // compatible with SQLite test databases; tenant isolation is still
            // enforced by the BelongsToTenant trait and tenant_id scoping.
            $table->foreign('parent_post_id')
                ->references('id')
                ->on('discussion_posts')
                ->cascadeOnDelete();
        });

        Schema::create('discussion_participants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('discussion_thread_id');
            $table->foreignId('tenant_user_id');
            $table->foreignId('last_read_post_id')->nullable();
            $table->timestamp('last_read_at')->nullable();
            $table->timestamps();

            $table->unique(['tenant_id', 'discussion_thread_id', 'tenant_user_id'], 'discussion_participants_unique');
            $table->foreign(['discussion_thread_id', 'tenant_id'])
                ->references(['id', 'tenant_id'])
                ->on('discussion_threads')
                ->cascadeOnDelete();
            $table->foreign(['tenant_user_id', 'tenant_id'])
                ->references(['id', 'tenant_id'])
                ->on('tenant_users')
                ->cascadeOnDelete();
        });

        Schema::create('discussion_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('discussion_post_id');
            $table->foreignId('reported_by_tenant_user_id');
            $table->string('reason');
            $table->text('note')->nullable();
            $table->string('status')->default('pending')->index();
            $table->foreignId('reviewed_by_tenant_user_id')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->jsonb('metadata');
            $table->timestamps();

            $table->index(['tenant_id', 'status']);
            $table->foreign(['discussion_post_id', 'tenant_id'])
                ->references(['id', 'tenant_id'])
                ->on('discussion_posts')
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
    }

    public function down(): void
    {
        Schema::dropIfExists('discussion_reports');
        Schema::dropIfExists('discussion_participants');
        Schema::dropIfExists('discussion_posts');
        Schema::dropIfExists('discussion_threads');
    }
};
