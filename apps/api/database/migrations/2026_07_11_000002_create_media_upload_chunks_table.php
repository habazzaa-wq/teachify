<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('media_upload_chunks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('media_upload_session_id')
                ->constrained('media_upload_sessions')
                ->cascadeOnDelete();
            $table->unsignedInteger('chunk_index');
            $table->string('chunk_hash')->nullable();
            $table->string('status')->default('pending');
            $table->unsignedBigInteger('byte_offset')->default(0);
            $table->unsignedBigInteger('byte_length')->default(0);
            // Relative path inside the tenant-scoped temporary uploads disk.
            $table->string('temp_path')->nullable();
            $table->timestamps();

            $table->unique(['media_upload_session_id', 'chunk_index']);
            $table->index(['media_upload_session_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('media_upload_chunks');
    }
};
