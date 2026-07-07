<?php

namespace App\Services\Media;

use App\Contracts\Media\MediaProvider;
use InvalidArgumentException;

class MediaManager
{
    /**
     * @var array<string, MediaProvider>
     */
    private array $providers = [];

    /**
     * @var array<string, MediaProvider>
     */
    private array $serviceProviders = [];

    public function register(string $provider, MediaProvider $implementation): void
    {
        $this->providers[$provider] = $implementation;
    }

    public function registerService(string $provider, string $service, MediaProvider $implementation): void
    {
        $this->serviceProviders[$this->serviceKey($provider, $service)] = $implementation;
    }

    public function provider(string $provider): MediaProvider
    {
        if (! isset($this->providers[$provider])) {
            throw new InvalidArgumentException("Media provider [{$provider}] is not registered.");
        }

        return $this->providers[$provider];
    }

    public function providerFor(string $provider, ?string $service = null): MediaProvider
    {
        if ($service !== null && isset($this->serviceProviders[$this->serviceKey($provider, $service)])) {
            return $this->serviceProviders[$this->serviceKey($provider, $service)];
        }

        return $this->provider($provider);
    }

    public function hasProvider(string $provider): bool
    {
        return isset($this->providers[$provider]);
    }

    public function hasServiceProvider(string $provider, string $service): bool
    {
        return isset($this->serviceProviders[$this->serviceKey($provider, $service)]);
    }

    private function serviceKey(string $provider, string $service): string
    {
        return "{$provider}:{$service}";
    }
}
