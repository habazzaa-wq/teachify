<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->text('description')->nullable()->after('status');
            $table->string('phone')->nullable()->after('description');
            $table->string('timezone', 64)->default('Asia/Riyadh')->after('phone');
            $table->string('language', 8)->default('ar')->after('timezone');
            $table->string('currency', 8)->default('SAR')->after('language');
            $table->string('company_name')->nullable()->after('currency');
            $table->string('support_email')->nullable()->after('company_name');
            $table->text('notes')->nullable()->after('support_email');
            $table->json('tags')->nullable()->after('notes');
            $table->json('address')->nullable()->after('tags');
            $table->json('owner')->nullable()->after('address');
            $table->json('owner_account')->nullable()->after('owner');
            $table->json('branding')->nullable()->after('owner_account');
            $table->json('limits')->nullable()->after('branding');
            $table->json('integrations_json')->nullable()->after('limits');
            $table->json('security')->nullable()->after('integrations_json');
            $table->json('storage_json')->nullable()->after('security');
        });
    }

    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn([
                'description', 'phone', 'timezone', 'language', 'currency',
                'company_name', 'support_email', 'notes', 'tags', 'address',
                'owner', 'owner_account', 'branding', 'limits',
                'integrations_json', 'security', 'storage_json',
            ]);
        });
    }
};
