<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('avatar')->nullable()->after('remember_token');
            $table->string('phone', 50)->nullable()->after('avatar');
            $table->string('locale', 10)->default('ar')->after('phone');
            $table->string('timezone', 64)->default('UTC')->after('locale');
        });

        Schema::table('tenant_users', function (Blueprint $table) {
            $table->string('phone', 50)->nullable()->after('user_id');
            $table->string('avatar')->nullable()->after('phone');
            $table->string('locale', 10)->default('ar')->after('avatar');
            $table->string('timezone', 64)->default('UTC')->after('locale');
            $table->string('department', 100)->nullable()->after('timezone');
            $table->string('job_title', 255)->nullable()->after('department');
            $table->text('notes')->nullable()->after('job_title');
            $table->timestamp('last_login_at')->nullable()->after('last_accessed_at');
            $table->string('last_login_ip', 45)->nullable()->after('last_login_at');
            $table->foreignId('created_by_tenant_user_id')->nullable()->constrained('tenant_users', 'id')->nullOnDelete();
            $table->foreignId('updated_by_tenant_user_id')->nullable()->constrained('tenant_users', 'id')->nullOnDelete();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::table('tenant_users', function (Blueprint $table) {
            $table->dropForeign(['created_by_tenant_user_id']);
            $table->dropForeign(['updated_by_tenant_user_id']);
            $table->dropColumn([
                'phone', 'avatar', 'locale', 'timezone', 'department', 'job_title',
                'notes', 'last_login_at', 'last_login_ip',
                'created_by_tenant_user_id', 'updated_by_tenant_user_id', 'deleted_at',
            ]);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['avatar', 'phone', 'locale', 'timezone', 'deleted_at']);
        });
    }
};
