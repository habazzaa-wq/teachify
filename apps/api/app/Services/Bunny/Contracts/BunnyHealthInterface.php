<?php

namespace App\Services\Bunny\Contracts;

interface BunnyHealthInterface
{
    public function ping(): array;

    public function verifyCredentials(): array;

    public function verifyStorage(): array;

    public function verifyStream(): array;

    public function measureLatency(): array;

    public function measureApiAvailability(): array;

    public function fullHealthCheck(): array;
}
