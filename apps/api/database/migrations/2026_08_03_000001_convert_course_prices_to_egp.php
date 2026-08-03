<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Convert all course prices to the Egyptian Pound (EGP) currency.
 *
 * The platform is billed and displayed in EGP, matching the student wallet
 * currency. Any courses still stored with the legacy SAR currency are updated
 * to EGP so the public course page and purchase flow stay consistent.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('courses')
            ->where('price_currency', 'SAR')
            ->update(['price_currency' => 'EGP']);
    }

    public function down(): void
    {
        DB::table('courses')
            ->where('price_currency', 'EGP')
            ->update(['price_currency' => 'SAR']);
    }
};
