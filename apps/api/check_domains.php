<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== tenant_domains ===\n";
foreach (DB::table('tenant_domains')->get() as $d) {
    printf("id=%s tenant_id=%s domain=%s subdomain=%s type=%s status=%s ssl=%s\n",
        $d->id, $d->tenant_id, $d->domain, $d->subdomain ?? '-', $d->type ?? '-', $d->status, $d->ssl_status ?? '-');
}

echo "=== tenants ===\n";
foreach (DB::table('tenants')->get() as $t) {
    printf("id=%s name=%s slug=%s status=%s\n", $t->id, $t->name, $t->slug, $t->status);
}

echo "=== platform.tenant_id config ===\n";
var_dump(config('platform.tenant_id'));

echo "=== findByDomain('the-mechanist.com') ===\n";
$repo = app(App\Repositories\TenantRepository::class);
$t = $repo->findByDomain('the-mechanist.com');
var_dump($t ? $t->id.' '.$t->name : null);

echo "=== findByDomain('www.the-mechanist.com') ===\n";
$t2 = $repo->findByDomain('www.the-mechanist.com');
var_dump($t2 ? $t2->id.' '.$t2->name : null);
