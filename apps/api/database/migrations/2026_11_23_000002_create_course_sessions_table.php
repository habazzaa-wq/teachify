<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('course_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->foreignId('created_by_tenant_user_id')->nullable()->constrained('tenant_users')->nullOnDelete();
            $table->foreignId('instructor_tenant_user_id')->nullable()->constrained('tenant_users')->nullOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('session_type')->index();
            $table->string('status')->default('draft')->index();
            $table->timestamp('starts_at_utc')->nullable();
            $table->timestamp('ends_at_utc')->nullable();
            $table->string('timezone', 64)->nullable();
            $table->text('meeting_url')->nullable();
            $table->string('meeting_provider')->nullable();
            $table->string('location_name')->nullable();
            $table->text('location_address')->nullable();
            $table->decimal('location_latitude', 10, 7)->nullable();
            $table->decimal('location_longitude', 10, 7)->nullable();
            $table->text('location_maps_url')->nullable();
            $table->text('cancellation_reason')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamp('rescheduled_from_starts_at_utc')->nullable();
            $table->jsonb('metadata')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['id', 'tenant_id']);
            $table->index(['tenant_id', 'course_id', 'starts_at_utc'], 'course_sessions_tenant_course_starts_idx');
            $table->index(['tenant_id', 'instructor_tenant_user_id', 'starts_at_utc'], 'course_sessions_tenant_instructor_starts_idx');
            $table->index(['tenant_id', 'status', 'starts_at_utc'], 'course_sessions_tenant_status_starts_idx');
            $table->foreign(['course_id', 'tenant_id'])
                ->references(['id', 'tenant_id'])
                ->on('courses')
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('course_sessions');
    }
};
