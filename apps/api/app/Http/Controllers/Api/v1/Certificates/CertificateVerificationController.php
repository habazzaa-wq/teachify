<?php

namespace App\Http\Controllers\Api\v1\Certificates;

use App\Http\Controllers\Controller;
use App\Services\Certificates\CertificateVerificationService;
use Illuminate\Http\JsonResponse;

class CertificateVerificationController extends Controller
{
    public function show(string $code, CertificateVerificationService $verifications): JsonResponse
    {
        return response()->json($verifications->verify($code));
    }
}
