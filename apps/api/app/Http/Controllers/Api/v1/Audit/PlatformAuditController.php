<?php

namespace App\Http\Controllers\Api\v1\Audit;

use App\Http\Controllers\Controller;
use App\Models\PlatformAuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PlatformAuditController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'event_type' => ['sometimes', 'string', 'max:100'],
            'entity_type' => ['sometimes', 'string', 'max:100'],
            'entity_id' => ['sometimes'],
            'from' => ['sometimes', 'date'],
            'to' => ['sometimes', 'date'],
        ]);

        $logs = PlatformAuditLog::query()
            ->when(
                $validated['event_type'] ?? null,
                fn ($query, $eventType) => $query->where('event_type', $eventType),
            )
            ->when(
                $validated['entity_type'] ?? null,
                fn ($query, $entityType) => $query->where('entity_type', $entityType),
            )
            ->when(
                $validated['entity_id'] ?? null,
                fn ($query, $entityId) => $query->where('entity_id', $entityId),
            )
            ->when(
                ($validated['from'] ?? null) && ($validated['to'] ?? null),
                fn ($query) => $query->whereBetween('created_at', [$validated['from'], $validated['to']]),
            )
            ->orderByDesc('created_at')
            ->paginate(25);

        return response()->json($logs);
    }
}
