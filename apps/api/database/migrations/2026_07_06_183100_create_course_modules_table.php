<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('course_modules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->string('slug')->nullable();
            $table->text('description')->nullable();
            $table->unsignedInteger('order')->default(0);
            $table->string('status')->default('draft')->index();
            $table->boolean('is_published')->default(false);
            $table->boolean('featured')->default(false);
            $table->unsignedInteger('estimated_duration')->nullable();
            $table->string('color', 20)->nullable();
            $table->string('icon', 100)->nullable();
            $table->text('notes')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['tenant_id', 'course_id', 'status']);
            $table->index(['tenant_id', 'course_id', 'order']);
            $table->index(['tenant_id', 'featured']);
            $table->unique(['course_id', 'slug', 'tenant_id']);

            $table->foreign(['course_id', 'tenant_id'])
                ->references(['id', 'tenant_id'])
                ->on('courses')
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('course_modules');
    }
};
