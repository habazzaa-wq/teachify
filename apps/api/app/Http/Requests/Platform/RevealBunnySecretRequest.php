<?php

namespace App\Http\Requests\Platform;

use Illuminate\Foundation\Http\FormRequest;

class RevealBunnySecretRequest extends FormRequest
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
            'field' => ['required', 'string', 'in:api_key,stream_api_key,storage_zone_password,signed_url_secret'],
            'confirm' => ['required', 'boolean', 'accepted'],
        ];
    }
}
