<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class ExamAnalyticsResource extends JsonResource
{
    public function toArray($request): array
    {
        return $this->resource;
    }
}
