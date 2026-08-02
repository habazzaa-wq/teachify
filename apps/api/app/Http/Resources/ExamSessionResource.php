<?php

namespace App\Http\Resources;

use App\Services\ExamBank\DTO\ExamSessionData;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ExamSessionResource extends JsonResource
{
    /** @var ExamSessionData */
    public $resource;

    public function toArray(Request $request): array
    {
        return $this->resource->toArray();
    }
}
