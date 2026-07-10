<?php

namespace App\Casts;

use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Support\Facades\Crypt;
use RuntimeException;

/**
 * Encrypts a single attribute at rest using the application key.
 *
 * Null values are preserved as null. Decryption failures fall back to null
 * so a corrupted payload never crashes reads.
 */
class Encrypted implements CastsAttributes
{
    public function get($model, string $key, $value, array $attributes)
    {
        if ($value === null || $value === '') {
            return null;
        }

        try {
            return Crypt::decryptString($value);
        } catch (\Throwable) {
            return null;
        }
    }

    public function set($model, string $key, $value, array $attributes)
    {
        if ($value === null || $value === '') {
            return null;
        }

        if (! is_string($value)) {
            throw new RuntimeException("The {$key} attribute must be a string before encryption.");
        }

        return Crypt::encryptString($value);
    }
}
