<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tenant_usage', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id')->unique();
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            $table->bigInteger('storage_bytes')->default(0);
            $table->bigInteger('bandwidth_bytes')->default(0);
            $table->bigInteger('stream_bandwidth_bytes')->default(0);
            $table->bigInteger('cdn_bandwidth_bytes')->default(0);
            $table->bigInteger('requests')->default(0);
            $table->bigInteger('views')->default(0);
            $table->integer('uploaded_files')->default(0);
            $table->integer('uploaded_videos')->default(0);
            $table->integer('collections')->default(0);
            $table->integer('folders')->default(0);
            $table->jsonb('metadata')->nullable();
            $table->timestamp('last_synced_at')->nullable();
            $table->timestamps();
        });

        Schema::create('tenant_usage_history', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            $table->string('period', 16);
            $table->date('date');
            $table->bigInteger('storage_bytes')->default(0);
            $table->bigInteger('bandwidth_bytes')->default(0);
            $table->bigInteger('views')->default(0);
            $table->bigInteger('requests')->default(0);
            $table->bigInteger('stream_bandwidth')->default(0);
            $table->bigInteger('cdn_bandwidth')->default(0);
            $table->jsonb('metadata')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'period', 'date']);
        });

        Schema::create('tenant_usage_snapshots', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            $table->timestamp('snapshot_at');
            $table->bigInteger('storage_bytes')->default(0);
            $table->bigInteger('bandwidth_bytes')->default(0);
            $table->bigInteger('views')->default(0);
            $table->bigInteger('requests')->default(0);
            $table->jsonb('metadata')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'snapshot_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenant_usage_snapshots');
        Schema::dropIfExists('tenant_usage_history');
        Schema::dropIfExists('tenant_usage');
    }
};
