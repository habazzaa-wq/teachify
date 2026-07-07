<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('courses', function (Blueprint $table) {
            $table->text('short_description')->nullable()->after('subtitle');
            $table->longText('full_description')->nullable()->after('description');
            $table->string('cover_image_path')->nullable()->after('thumbnail_path');
            $table->string('difficulty')->default('beginner')->index()->after('visibility');
            $table->string('language')->default('ar')->after('difficulty');
            $table->unsignedInteger('duration')->nullable()->after('language');
            $table->unsignedBigInteger('discount_price')->nullable()->after('price_amount');
            $table->unsignedInteger('enrollment_limit')->nullable()->after('discount_price');
            $table->timestamp('start_date')->nullable()->after('enrollment_limit');
            $table->timestamp('end_date')->nullable()->after('start_date');
            $table->boolean('certificate_enabled')->default(false)->after('end_date');
            $table->boolean('featured')->default(false)->index()->after('certificate_enabled');
            $table->string('seo_title')->nullable()->after('featured');
            $table->text('seo_description')->nullable()->after('seo_title');
            $table->string('seo_keywords')->nullable()->after('seo_description');
            $table->json('requirements')->nullable()->after('seo_keywords');
            $table->json('learning_outcomes')->nullable()->after('requirements');
            $table->json('target_audience')->nullable()->after('learning_outcomes');

            $table->index(['tenant_id', 'difficulty']);
            $table->index(['tenant_id', 'featured']);
            $table->index(['tenant_id', 'language']);
        });
    }

    public function down(): void
    {
        Schema::table('courses', function (Blueprint $table) {
            $table->dropColumn([
                'short_description',
                'full_description',
                'cover_image_path',
                'difficulty',
                'language',
                'duration',
                'discount_price',
                'enrollment_limit',
                'start_date',
                'end_date',
                'certificate_enabled',
                'featured',
                'seo_title',
                'seo_description',
                'seo_keywords',
                'requirements',
                'learning_outcomes',
                'target_audience',
            ]);
        });
    }
};
