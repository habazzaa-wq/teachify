<?php

namespace App\Http\Middleware;

use App\Services\UploadGuard\UploadGuardService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class UploadQuotaMiddleware
{
    public function __construct(
        private readonly UploadGuardService $guard,
    ) {
    }

    public function handle(Request $request, Closure $next, ?string $uploadType = null): Response
    {
        $tenant = currentTenant();

        $type = $uploadType ?? $this->detectUploadType($request);
        $sizeBytes = $request->input('size_bytes') ?? $request->file()?->getSize();
        $mime = $request->input('mime_type') ?? $request->file()?->getMimeType();

        try {
            $result = $this->guard->guardUpload($tenant, $type, $sizeBytes, $mime);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'error' => class_basename($e),
                'details' => method_exists($e, 'toArray') ? $e->toArray() : [],
            ], $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 403);
        }

        $request->merge(['_upload_guard' => $result]);

        return $next($request);
    }

    private function detectUploadType(Request $request): string
    {
        $type = $request->input('type') ?? $request->route()->getActionMethod();

        $typeMap = [
            'video' => 'video',
            'image' => 'file',
            'document' => 'file',
            'archive' => 'file',
            'attachment' => 'file',
            'caption' => 'file',
            'thumbnail' => 'file',
            'folder' => 'folder',
            'collection' => 'collection',
            'store' => 'file',
        ];

        return $typeMap[$type] ?? 'file';
    }
}
