<?php

namespace Tests\Feature;

use App\Support\Correlation;
use Tests\TestCase;

/**
 * P3 request correlation: every API request gets an id, an incoming valid id
 * is respected, invalid/oversized ids are replaced, the id is echoed in the
 * response header, and each request gets its own id (context cleared).
 */
class RequestCorrelationTest extends TestCase
{
    private const PATTERN = '/^[A-Za-z0-9_.\-]{1,64}$/';

    public function test_generated_when_absent(): void
    {
        $response = $this->getJson('/api/v1/health/ready');

        $id = $response->headers->get('X-Request-Id');
        $this->assertNotNull($id);
        $this->assertMatchesRegularExpression(self::PATTERN, $id);
    }

    public function test_valid_incoming_id_respected(): void
    {
        $response = $this->withHeader('X-Request-Id', 'abc-123-XYZ')
            ->getJson('/api/v1/health/ready');

        $this->assertSame('abc-123-XYZ', $response->headers->get('X-Request-Id'));
    }

    public function test_invalid_incoming_id_replaced(): void
    {
        $response = $this->withHeader('X-Request-Id', 'bad id with spaces')
            ->getJson('/api/v1/health/ready');

        $id = $response->headers->get('X-Request-Id');
        $this->assertNotNull($id);
        $this->assertNotSame('bad id with spaces', $id);
        $this->assertMatchesRegularExpression(self::PATTERN, $id);
    }

    public function test_oversized_incoming_id_replaced(): void
    {
        $oversized = str_repeat('a', 200);
        $response = $this->withHeader('X-Request-Id', $oversized)
            ->getJson('/api/v1/health/ready');

        $id = $response->headers->get('X-Request-Id');
        $this->assertNotNull($id);
        $this->assertNotSame($oversized, $id);
        $this->assertLessThanOrEqual(64, strlen($id));
    }

    public function test_distinct_id_per_request(): void
    {
        $first = $this->getJson('/api/v1/health/ready')->headers->get('X-Request-Id');
        $second = $this->getJson('/api/v1/health/ready')->headers->get('X-Request-Id');

        $this->assertNotNull($first);
        $this->assertNotNull($second);
        $this->assertNotSame($first, $second);
    }

    public function test_correlation_helper_clears(): void
    {
        Correlation::set('req_x');
        $this->assertSame('req_x', Correlation::id());
        Correlation::set(null);
        $this->assertNull(Correlation::id());
    }
}
