<?php

namespace App\Http\Requests\Platform;

use Illuminate\Foundation\Http\FormRequest;

class PlatformBunnySettingRequest extends FormRequest
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
            'storage_zone_name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'storage_zone_password' => ['sometimes', 'nullable', 'string', 'max:512'],
            'storage_zone_region' => ['sometimes', 'string', 'in:de,uk,gb,sg,la,ny'],
            'cdn_hostname' => ['sometimes', 'nullable', 'string', 'max:255'],
            'library_id' => ['sometimes', 'nullable', 'string', 'max:255'],
            'api_key' => ['sometimes', 'nullable', 'string', 'max:512'],
            'stream_api_key' => ['sometimes', 'nullable', 'string', 'max:512'],
            'signed_url_secret' => ['sometimes', 'nullable', 'string', 'max:512'],
            'enabled' => ['sometimes', 'boolean'],
            'default_privacy' => ['sometimes', 'string', 'in:private,public,paid'],
            'default_expiration_days' => ['sometimes', 'nullable', 'integer', 'min:0', 'max:3650'],
            'max_upload_size' => ['sometimes', 'nullable', 'integer', 'min:1'],
            'chunk_size' => ['sometimes', 'nullable', 'integer', 'min:1', 'max:512'],
            'enable_stream' => ['sometimes', 'boolean'],
            'enable_cdn' => ['sometimes', 'boolean'],
            'enable_signed_urls' => ['sometimes', 'boolean'],
            'enable_transcoding' => ['sometimes', 'boolean'],
            'default_thumbnail_time' => ['sometimes', 'nullable', 'integer', 'min:0', 'max:3600'],
            'metadata' => ['sometimes', 'nullable', 'array'],
        ];
    }
}
