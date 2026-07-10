<?php

namespace App\Services\Bunny\Contracts;

interface BunnyWebhookInterface
{
    public function validateSignature(string $payload, string $signature): bool;

    public function processWebhook(array $payload, ?string $eventType = null): array;

    public function getWebhookSecret(): ?string;
}
