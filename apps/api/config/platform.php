<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Platform tenant
    |--------------------------------------------------------------------------
    |
    | When the platform is accessed on its bare host (e.g. the-mechanist.com)
    | the domain is often not present in the `tenant_domains` table — only
    | subdomains and verified custom domains are. As a result
    | `TenantRepository::findByDomain()` returns null for the bare host and the
    | public (logged-out) site can never load the platform branding / SEO that
    | the teacher manages in settings.
    |
    | Set PLATFORM_TENANT_ID to the id of the tenant that owns the platform
    | branding so the public site resolves it. If left null and the deployment
    | has exactly one active tenant, that tenant is used automatically (covers
    | single-tenant installations without any config).
    |
    */

    'tenant_id' => env('PLATFORM_TENANT_ID'),

];
