<?php

namespace Database\Factories;

use App\Models\Tenant;
use App\Models\TenantInvitation;
use App\Services\Support\EmailNormalizer;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<TenantInvitation>
 */
class TenantInvitationFactory extends Factory
{
    public function definition(): array
    {
        $email = fake()->unique()->safeEmail();

        return [
            'tenant_id' => Tenant::factory(),
            'email' => $email,
            'normalized_email' => app(EmailNormalizer::class)->normalize($email),
            'token_hash' => hash('sha256', Str::random(64)),
            'status' => 'pending',
            'invited_by_user_id' => null,
            'accepted_by_user_id' => null,
            'expires_at' => now()->addDays(7),
            'accepted_at' => null,
        ];
    }

    public function withToken(string $token): static
    {
        return $this->state(fn (array $attributes) => [
            'token_hash' => hash('sha256', $token),
        ]);
    }

    public function expired(): static
    {
        return $this->state(fn (array $attributes) => [
            'expires_at' => now()->subMinute(),
        ]);
    }

    public function accepted(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'accepted',
            'accepted_at' => now(),
        ]);
    }
}
