<?php

namespace App\Http\Controllers\Api\v1\Platform;

use App\Http\Controllers\Controller;
use App\Http\Requests\Platform\PlatformBunnySettingRequest;
use App\Http\Requests\Platform\RevealBunnySecretRequest;
use App\Http\Requests\Platform\RotateBunnySecretsRequest;
use App\Http\Requests\Platform\VerifyBunnyConnectionRequest;
use App\Http\Resources\PlatformBunnySettingResource;
use App\Models\PlatformBunnySetting;
use App\Services\Platform\PlatformBunnySettingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class PlatformBunnySettingController extends Controller
{
    public function __construct(
        private readonly PlatformBunnySettingService $service,
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        Gate::authorize('view', PlatformBunnySetting::class);

        return response()->json([
            'settings' => new PlatformBunnySettingResource($this->service->getSettings()),
        ]);
    }

    public function update(PlatformBunnySettingRequest $request): JsonResponse
    {
        Gate::authorize('update', PlatformBunnySetting::class);

        try {
            $settings = $this->service->updateSettings($request->validated(), $request->user());
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'The Bunny credentials could not be verified.',
                'errors' => $e->errors(),
            ], 422);
        }

        return response()->json([
            'message' => 'Platform Bunny settings saved.',
            'settings' => new PlatformBunnySettingResource($settings),
        ]);
    }

    public function verify(VerifyBunnyConnectionRequest $request): JsonResponse
    {
        Gate::authorize('verify', PlatformBunnySetting::class);

        $result = $this->service->verifyConnection($request->validated());

        $code = $result['status'] === PlatformBunnySetting::CONNECTION_CONNECTED ? 200 : 422;

        return response()->json($result, $code);
    }

    public function health(Request $request): JsonResponse
    {
        Gate::authorize('health', PlatformBunnySetting::class);

        return response()->json($this->service->healthCheck());
    }

    public function rotate(RotateBunnySecretsRequest $request): JsonResponse
    {
        Gate::authorize('rotate', PlatformBunnySetting::class);

        try {
            $settings = $this->service->rotateSecrets($request->validated(), $request->user());
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'The rotated credentials could not be verified.',
                'errors' => $e->errors(),
            ], 422);
        }

        return response()->json([
            'message' => 'Bunny secrets rotated.',
            'settings' => new PlatformBunnySettingResource($settings),
        ]);
    }

    public function reveal(RevealBunnySecretRequest $request): JsonResponse
    {
        Gate::authorize('reveal', PlatformBunnySetting::class);

        $value = $this->service->revealSecret($request->validated()['field'], $request->user());

        return response()->json([
            'field' => $request->validated()['field'],
            'value' => $value,
        ]);
    }

    public function disable(Request $request): JsonResponse
    {
        Gate::authorize('disable', PlatformBunnySetting::class);

        $settings = $this->service->disableIntegration($request->user());

        return response()->json([
            'message' => 'Bunny integration disabled.',
            'settings' => new PlatformBunnySettingResource($settings),
        ]);
    }

    public function deleteCredentials(Request $request): JsonResponse
    {
        Gate::authorize('deleteCredentials', PlatformBunnySetting::class);

        $settings = $this->service->deleteCredentials($request->user());

        return response()->json([
            'message' => 'Bunny credentials deleted.',
            'settings' => new PlatformBunnySettingResource($settings),
        ]);
    }

    public function reset(Request $request): JsonResponse
    {
        Gate::authorize('reset', PlatformBunnySetting::class);

        $settings = $this->service->resetConfiguration($request->user());

        return response()->json([
            'message' => 'Bunny configuration reset to platform defaults.',
            'settings' => new PlatformBunnySettingResource($settings),
        ]);
    }
}
