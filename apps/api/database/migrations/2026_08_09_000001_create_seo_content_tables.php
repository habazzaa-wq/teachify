<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('seo_contents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            // Optional polymorphic link to an existing entity (course/stage/subject/category).
            $table->nullableMorphs('seoable');
            // article | guide | faq_collection | custom_page | course | stage | subject | category
            $table->string('content_type')->default('article');
            $table->string('title');
            $table->string('slug');
            // draft | review | published | archived
            $table->string('status')->default('draft');
            $table->boolean('indexable')->default(true);
            $table->boolean('in_sitemap')->default(true);
            $table->text('excerpt')->nullable();
            $table->longText('content')->nullable();
            // markdown | html
            $table->string('content_format')->default('markdown');
            $table->foreignId('author_tenant_user_id')->nullable()->constrained('tenant_users')->nullOnDelete();

            $table->string('seo_title')->nullable();
            $table->string('seo_description')->nullable();
            $table->string('focus_keyword')->nullable();
            $table->json('secondary_keywords')->nullable();
            $table->string('canonical_url')->nullable();
            $table->string('og_title')->nullable();
            $table->string('og_description')->nullable();
            $table->string('twitter_title')->nullable();
            $table->string('twitter_description')->nullable();
            $table->foreignId('featured_image_asset_id')->nullable()->constrained('media_assets')->nullOnDelete();
            $table->foreignId('og_image_asset_id')->nullable()->constrained('media_assets')->nullOnDelete();
            $table->foreignId('twitter_image_asset_id')->nullable()->constrained('media_assets')->nullOnDelete();
            // article | news_article | faq_page | course | item_list | breadcrumb | none
            $table->string('structured_data_type')->default('article');

            $table->timestamp('published_at')->nullable();
            $table->timestamp('archived_at')->nullable();
            $table->softDeletes();
            $table->timestamps();

            $table->unique(['tenant_id', 'slug']);
            $table->index(['tenant_id', 'content_type', 'status']);
            $table->index(['tenant_id', 'seoable_type', 'seoable_id']);
            $table->index(['tenant_id', 'status', 'published_at']);
        });

        Schema::create('seo_faqs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('seo_content_id')->constrained('seo_contents')->cascadeOnDelete();
            $table->string('question');
            $table->text('answer');
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_published')->default(true);
            $table->timestamps();

            $table->index(['seo_content_id', 'sort_order']);
            $table->index(['tenant_id']);
        });

        Schema::create('seo_keywords', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('seo_content_id')->nullable()->constrained('seo_contents')->nullOnDelete();
            $table->string('keyword');
            // focus | related | long_tail
            $table->string('keyword_type')->default('related');
            // informational | commercial | transactional | navigational
            $table->string('search_intent')->nullable();
            $table->text('notes')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['tenant_id', 'keyword_type']);
            $table->index(['seo_content_id']);
        });

        Schema::create('seo_content_links', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('seo_content_id')->constrained('seo_contents')->cascadeOnDelete();
            $table->foreignId('target_seo_content_id')->nullable()->constrained('seo_contents')->nullOnDelete();
            $table->string('target_type')->nullable();
            $table->unsignedBigInteger('target_id')->nullable();
            $table->string('target_url')->nullable();
            $table->string('anchor_text')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['seo_content_id', 'sort_order']);
            $table->index(['tenant_id']);
        });

        Schema::create('seo_revisions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('seo_content_id')->constrained('seo_contents')->cascadeOnDelete();
            $table->foreignId('editor_tenant_user_id')->nullable()->constrained('tenant_users')->nullOnDelete();
            $table->string('action')->default('updated');
            $table->json('snapshot')->nullable();
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('seo_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->string('default_title_template')->nullable();
            $table->string('default_description')->nullable();
            $table->foreignId('default_og_image_asset_id')->nullable()->constrained('media_assets')->nullOnDelete();
            $table->foreignId('default_twitter_image_asset_id')->nullable()->constrained('media_assets')->nullOnDelete();
            $table->string('default_robots_policy')->default('index');
            $table->boolean('sitemap_include_default')->default(true);
            $table->string('organization_name')->nullable();
            $table->text('organization_description')->nullable();
            $table->json('social_profiles')->nullable();
            $table->string('homepage_title')->nullable();
            $table->text('homepage_description')->nullable();
            $table->string('google_verification')->nullable();
            $table->string('bing_verification')->nullable();
            $table->timestamps();

            $table->unique('tenant_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('seo_settings');
        Schema::dropIfExists('seo_revisions');
        Schema::dropIfExists('seo_content_links');
        Schema::dropIfExists('seo_keywords');
        Schema::dropIfExists('seo_faqs');
        Schema::dropIfExists('seo_contents');
    }
};
