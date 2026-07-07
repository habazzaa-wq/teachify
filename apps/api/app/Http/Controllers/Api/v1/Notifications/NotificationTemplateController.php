<?php

namespace App\Http\Controllers\Api\v1\Notifications;

use App\Http\Controllers\Controller;
use App\Models\NotificationTemplate;
use App\Models\TenantUser;
use App\Policies\NotificationPolicy;
use App\Services\Notifications\NotificationTemplateService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class NotificationTemplateController extends Controller
{
    public function index(NotificationTemplateService $templates, NotificationPolicy $policy): JsonResponse
    {
        abort_unless($policy->manageTemplate(app(TenantUser::class), currentTenant()), 403);

        return response()->json([
            'templates' => $templates->list(currentTenant()),
        ]);
    }

    public function store(Request $request, NotificationTemplateService $templates, NotificationPolicy $policy): JsonResponse
    {
        abort_unless($policy->manageTemplate(app(TenantUser::class), currentTenant()), 403);

        $validated = $request->validate([
            'slug' => ['required', 'string', 'max:255'],
            'name' => ['required', 'string', 'max:255'],
            'channel' => ['required', Rule::in(['in_app', 'email'])],
            'subject' => ['nullable', 'string', 'max:255'],
            'body' => ['required', 'string'],
            'variables' => ['sometimes', 'array'],
            'is_system' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        return response()->json([
            'message' => 'Notification template created.',
            'template' => $templates->create(currentTenant(), $validated),
        ], 201);
    }

    public function update(
        Request $request,
        NotificationTemplate $template,
        NotificationTemplateService $templates,
        NotificationPolicy $policy,
    ): JsonResponse {
        abort_if($template->tenant_id !== currentTenant()->id, 404);
        abort_unless($policy->manageTemplate(app(TenantUser::class), currentTenant(), $template), 403);

        $validated = $request->validate([
            'slug' => ['sometimes', 'string', 'max:255'],
            'name' => ['sometimes', 'string', 'max:255'],
            'channel' => ['sometimes', Rule::in(['in_app', 'email'])],
            'subject' => ['nullable', 'string', 'max:255'],
            'body' => ['sometimes', 'string'],
            'variables' => ['sometimes', 'array'],
            'is_system' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        return response()->json([
            'message' => 'Notification template updated.',
            'template' => $templates->update(currentTenant(), $template, $validated),
        ]);
    }

    public function destroy(NotificationTemplate $template, NotificationTemplateService $templates, NotificationPolicy $policy): JsonResponse
    {
        abort_if($template->tenant_id !== currentTenant()->id, 404);
        abort_unless($policy->manageTemplate(app(TenantUser::class), currentTenant(), $template), 403);

        $templates->delete(currentTenant(), $template);

        return response()->json([
            'message' => 'Notification template deleted.',
        ]);
    }
}
