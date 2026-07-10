<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('created_by_tenant_user_id')->nullable();
            $table->uuid('uuid')->nullable()->index();
            $table->unsignedBigInteger('category_id')->nullable();
            $table->unsignedBigInteger('bank_id')->nullable();
            $table->string('title');
            $table->string('slug');
            $table->text('description')->nullable();
            $table->string('type');
            $table->string('difficulty')->default('medium')->index();
            $table->json('tags')->nullable();
            $table->integer('points')->default(1);
            $table->integer('estimated_time')->nullable();
            $table->string('language')->default('ar');
            $table->string('status')->default('draft')->index();
            $table->string('visibility')->default('private')->index();
            $table->boolean('shuffle_options')->default(true);
            $table->text('explanation')->nullable();
            $table->text('hint')->nullable();
            $table->json('content')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['tenant_id', 'type']);
            $table->index(['tenant_id', 'category_id']);
            $table->index(['tenant_id', 'bank_id']);
            $table->index(['tenant_id', 'status']);
            $table->index(['tenant_id', 'visibility']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('questions');
    }
};
