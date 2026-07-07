<?php

namespace App\Http\Controllers\Api\v1\Auth;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use App\Models\Role;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class RoleController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        Gate::authorize('viewAny', Role::class);

        $query = Role::query()
            ->with('permissions')
            ->where('tenant_id', currentTenant()->id);

        if ($search = $request->string('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%");
            });
        }

        return response()->json(
            $query->orderBy('name')->paginate($request->integer('per_page', 50))
        );
    }

    public function store(Request $request): JsonResponse
    {
        Gate::authorize('create', Role::class);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['sometimes', 'string', 'max:255', 'alpha_dash:ascii'],
            'permission_ids' => ['sometimes', 'array'],
            'permission_ids.*' => ['integer', Rule::exists('permissions', 'id')],
        ]);

        if (! array_key_exists('slug', $validated)) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        $role = Role::create([
            'tenant_id' => currentTenant()->id,
            'name' => $validated['name'],
            'slug' => $validated['slug'],
        ]);

        if (! empty($validated['permission_ids'])) {
            $role->permissions()->sync($validated['permission_ids']);
        }

        return response()->json([
            'message' => 'Role created.',
            'role' => $role->load('permissions'),
        ], 201);
    }

    public function show(Role $role): JsonResponse
    {
        abort_if($role->tenant_id !== currentTenant()->id, 404);
        Gate::authorize('view', $role);

        return response()->json([
            'role' => $role->load('permissions'),
        ]);
    }

    public function update(Request $request, Role $role): JsonResponse
    {
        abort_if($role->tenant_id !== currentTenant()->id, 404);
        Gate::authorize('update', $role);

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'slug' => ['sometimes', 'string', 'max:255', 'alpha_dash:ascii'],
            'permission_ids' => ['sometimes', 'array'],
            'permission_ids.*' => ['integer', Rule::exists('permissions', 'id')],
        ]);

        $role->fill(collect($validated)->only(['name', 'slug'])->all())->save();

        if (array_key_exists('permission_ids', $validated)) {
            $role->permissions()->sync($validated['permission_ids']);
        }

        return response()->json([
            'message' => 'Role updated.',
            'role' => $role->refresh()->load('permissions'),
        ]);
    }

    public function destroy(Role $role): JsonResponse
    {
        abort_if($role->tenant_id !== currentTenant()->id, 404);
        Gate::authorize('delete', $role);

        if (in_array($role->slug, ['tenant_owner', 'admin', 'instructor', 'student'], true)) {
            return response()->json(['message' => 'System roles cannot be deleted.'], 422);
        }

        $role->delete();

        return response()->json(['message' => 'Role deleted.']);
    }

    public function permissions(): JsonResponse
    {
        return response()->json([
            'permissions' => Permission::query()->orderBy('name')->get(),
        ]);
    }
}
