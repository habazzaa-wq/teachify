<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenant_domains', function (Blueprint $table) {
            $table->string('verification_method')->nullable()->after('verification_token');
            $table->string('verification_type')->default('auto')->after('verification_method');
            $table->string('expected_ip', 45)->nullable()->after('verification_type');
            $table->text('verification_errors')->nullable()->after('expected_ip');
            $table->timestamp('last_dns_check')->nullable()->after('verification_errors');

            $table->string('ssl_provider')->nullable()->after('ssl_status');
            $table->timestamp('ssl_issued_at')->nullable()->after('ssl_provider');
            $table->timestamp('ssl_expires_at')->nullable()->after('ssl_issued_at');
            $table->integer('ssl_renewal_attempts')->default(0)->after('ssl_expires_at');
            $table->text('ssl_last_error')->nullable()->after('ssl_renewal_attempts');
            $table->timestamp('ssl_last_check')->nullable()->after('ssl_last_error');

            $table->timestamp('last_health_check_at')->nullable()->after('ssl_last_check');
            $table->integer('health_score')->default(0)->after('last_health_check_at');
        });
    }

    public function down(): void
    {
        Schema::table('tenant_domains', function (Blueprint $table) {
            $table->dropColumn([
                'verification_method',
                'verification_type',
                'expected_ip',
                'verification_errors',
                'last_dns_check',
                'ssl_provider',
                'ssl_issued_at',
                'ssl_expires_at',
                'ssl_renewal_attempts',
                'ssl_last_error',
                'ssl_last_check',
                'last_health_check_at',
                'health_score',
            ]);
        });
    }
};
