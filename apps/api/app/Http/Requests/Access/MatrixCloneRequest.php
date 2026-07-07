<?php

namespace App\Http\Requests\Access;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class MatrixCloneRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $tenantId = currentTenant()->id;

        return [
            'source_role_id' => [
                'required',
                'integer',
                Rule::exists('roles', 'id')->where('tenant_id', $tenantId),
            ],
            'target_role_id' => [
                'required',
                'integer',
                'different:source_role_id',
                Rule::exists('roles', 'id')->where('tenant_id', $tenantId),
            ],
        ];
    }
}
