<?php

namespace App\Http\Requests\Platform;

use Illuminate\Foundation\Http\FormRequest;

class RotateBunnySecretsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'api_key' => ['sometimes', 'nullable', 'string', 'max:512'],
            'stream_api_key' => ['sometimes', 'nullable', 'string', 'max:512'],
            'regenerate_signed_url_secret' => ['sometimes', 'boolean'],
        ];
    }
}
