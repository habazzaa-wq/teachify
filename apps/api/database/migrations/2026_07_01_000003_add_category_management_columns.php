<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->text('description')->nullable()->after('slug');
            $table->string('thumbnail_path')->nullable()->after('description');
            $table->string('icon')->nullable()->after('thumbnail_path');
            $table->string('color', 20)->nullable()->after('icon');
            $table->boolean('featured')->default(false)->index()->after('is_active');
            $table->renameColumn('is_active', 'active');
            $table->string('seo_title')->nullable()->after('featured');
            $table->string('seo_description')->nullable()->after('seo_title');
            $table->string('seo_keywords')->nullable()->after('seo_description');
            $table->softDeletes();

            $table->index(['tenant_id', 'active']);
            $table->index(['tenant_id', 'featured']);
            $table->index(['tenant_id', 'parent_id']);
        });
    }

    public function down(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->dropColumn([
                'description', 'thumbnail_path', 'icon', 'color',
                'featured', 'seo_title', 'seo_description', 'seo_keywords',
            ]);
            $table->renameColumn('active', 'is_active');
            $table->dropSoftDeletes();
            $table->dropIndex(['tenant_id', 'active']);
            $table->dropIndex(['tenant_id', 'featured']);
            $table->dropIndex(['tenant_id', 'parent_id']);
        });
    }
};
