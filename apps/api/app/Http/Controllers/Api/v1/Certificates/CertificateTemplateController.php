<?php

namespace App\Http\Controllers\Api\v1\Certificates;

use App\Http\Controllers\Controller;
use App\Models\CertificateTemplate;
use App\Models\User;
use App\Services\Authorization\TenantAuthorizationService;
use App\Services\Certificates\CertificateTemplateService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CertificateTemplateController extends Controller
{
    public function index(): JsonResponse
    {
        abort_unless($this->canManage(request()->user()), 403);

        return response()->json([
            'templates' => CertificateTemplate::query()->latest()->paginate(25),
        ]);
    }

    public function store(Request $request, CertificateTemplateService $templates): JsonResponse
    {
        abort_unless($this->canManage(request()->user()), 403);

        $template = $templates->create($this->validateTemplate($request));

        return response()->json([
            'message' => 'Certificate template created.',
            'template' => $template,
        ], 201);
    }

    public function update(Request $request, CertificateTemplate $template, CertificateTemplateService $templates): JsonResponse
    {
        abort_if($template->tenant_id !== currentTenant()->id, 404);
        abort_unless($this->canManage(request()->user()), 403);

        $template = $templates->update($template, $this->validateTemplate($request, true));

        return response()->json([
            'message' => 'Certificate template updated.',
            'template' => $template,
        ]);
    }

    public function updateStatus(Request $request, CertificateTemplate $template, CertificateTemplateService $templates): JsonResponse
    {
        abort_if($template->tenant_id !== currentTenant()->id, 404);
        abort_unless($this->canManage(request()->user()), 403);

        $validated = $request->validate([
            'status' => ['required', Rule::in(['draft', 'active', 'archived'])],
        ]);

        $template = $templates->changeStatus($template, $validated['status']);

        return response()->json([
            'message' => 'Certificate template status updated.',
            'template' => $template,
        ]);
    }

    public function destroy(CertificateTemplate $template, CertificateTemplateService $templates): JsonResponse
    {
        abort_if($template->tenant_id !== currentTenant()->id, 404);
        abort_unless($this->canManage(request()->user()), 403);

        $templates->delete($template);

        return response()->json(['message' => 'Certificate template deleted.']);
    }

    /**
     * @return array<string, mixed>
     */
    private function validateTemplate(Request $request, bool $partial = false): array
    {
        return $request->validate([
            'name' => [$partial ? 'sometimes' : 'required', 'string', 'max:255'],
            'slug' => ['sometimes', 'string', 'max:255', 'alpha_dash:ascii'],
            'template_data' => ['sometimes', 'array'],
        ]);
    }

    private function canManage(User $user): bool
    {
        $authorization = app(TenantAuthorizationService::class);
        $tenant = currentTenant();

        return (
            $authorization->hasRole($user, $tenant, 'tenant_owner')
            || $authorization->hasRole($user, $tenant, 'admin')
        ) && $authorization->hasPermission($user, $tenant, 'courses.update');
    }
}
