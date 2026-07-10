<?php

namespace App\Http\Requests\Platform;

use Illuminate\Foundation\Http\FormRequest;

class VerifyBunnyConnectionRequest extends FormRequest
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
            'storage_zone_name' => ['required', 'string', 'max:255'],
            'storage_zone_password' => ['required', 'string', 'max:512'],
            'storage_zone_region' => ['sometimes', 'string', 'in:de,uk,gb,sg,la,ny'],
            'api_key' => ['required', 'string', 'max:512'],
            'library_id' => ['sometimes', 'nullable', 'string', 'max:255'],
            'stream_api_key' => ['sometimes', 'nullable', 'string', 'max:512'],
            'enable_stream' => ['sometimes', 'boolean'],
        ];
    }
}
