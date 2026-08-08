<?php

namespace App\Http\Controllers\Api\v1\Community;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ClientDiagnosticsController extends Controller
{
    /**
     * TEMP diagnostic endpoint: forwards client-side errors to the server log.
     *
     * @return JsonResponse
     */
    public function report(Request $request): JsonResponse
    {
        Log::error('CLIENT_ERROR', [
            'body' => $request->getContent(),
            'referer' => $request->header('Referer'),
            'tenant' => $request->header('X-Tenant-ID'),
        ]);

        return response()->json(['ok' => true]);
    }
}
