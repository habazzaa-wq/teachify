<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exams', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('created_by_tenant_user_id')->nullable();
            $table->uuid('uuid')->nullable()->index();
            $table->string('title');
            $table->string('slug');
            $table->text('description')->nullable();
            $table->string('category')->nullable()->index();
            $table->string('status')->default('draft')->index();
            $table->string('visibility')->default('private')->index();
            $table->string('language')->default('ar');
            $table->integer('duration')->nullable();
            $table->integer('passing_score')->default(60);
            $table->integer('total_points')->default(0);
            $table->integer('question_count')->default(0);
            $table->integer('attempt_limit')->nullable();
            $table->boolean('shuffle_questions')->default(false);
            $table->boolean('shuffle_choices')->default(false);
            $table->boolean('show_results')->default(true);
            $table->boolean('show_correct_answers')->default(true);
            $table->boolean('allow_review')->default(true);
            $table->boolean('negative_marking')->default(false);
            $table->boolean('certificate_eligible')->default(false);
            $table->json('random_question_pool')->nullable();
            $table->boolean('pinned')->default(false);
            $table->boolean('featured')->default(false);
            $table->timestamp('published_at')->nullable()->index();
            $table->timestamp('archived_at')->nullable()->index();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['tenant_id', 'slug']);
            $table->index(['tenant_id', 'status']);
            $table->index(['tenant_id', 'visibility']);
            $table->index(['tenant_id', 'category']);
            $table->index(['tenant_id', 'pinned']);
            $table->index(['tenant_id', 'featured']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exams');
    }
};
