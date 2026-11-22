<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('notification_preferences', function (Blueprint $table) {
            $table->boolean('whatsapp_enabled')->default(false)->after('email_enabled');
        });

        Schema::table('notification_deliveries', function (Blueprint $table) {
            $table->string('provider')->nullable()->after('channel');
            $table->string('provider_message_id')->nullable()->after('provider');
            $table->jsonb('payload_snapshot')->nullable()->after('last_error');
            $table->timestamp('sent_at')->nullable()->after('payload_snapshot');
            $table->timestamp('failed_at')->nullable()->after('sent_at');
            $table->timestamp('next_retry_at')->nullable()->after('failed_at');
            $table->string('dedupe_key')->nullable()->after('next_retry_at');
            $table->unique(['tenant_id', 'dedupe_key'], 'notification_deliveries_tenant_dedupe_unique');
        });
    }

    public function down(): void
    {
        Schema::table('notification_deliveries', function (Blueprint $table) {
            $table->dropUnique('notification_deliveries_tenant_dedupe_unique');
            $table->dropColumn([
                'provider',
                'provider_message_id',
                'payload_snapshot',
                'sent_at',
                'failed_at',
                'next_retry_at',
                'dedupe_key',
            ]);
        });

        Schema::table('notification_preferences', function (Blueprint $table) {
            $table->dropColumn('whatsapp_enabled');
        });
    }
};
