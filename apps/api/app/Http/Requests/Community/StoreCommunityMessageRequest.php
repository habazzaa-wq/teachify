<?php

namespace App\Http\Requests\Community;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCommunityMessageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'body' => ['required', 'string', 'max:10000'],
            'content_type' => ['required', 'string', Rule::in([
                'text', 'code', 'math', 'announcement', 'image', 'file', 'pdf', 'voice', 'video',
            ])],
            'thread_id' => ['nullable', 'integer'],
            'parent_message_id' => ['nullable', 'integer'],
            'reply_to_message_id' => ['nullable', 'integer'],
            'mentions' => ['nullable', 'array', 'max:20'],
            'mentions.*' => ['integer', 'exists:tenant_users,id'],
            'attachments' => ['nullable', 'array', 'max:10'],
            'attachments.*.media_asset_id' => ['nullable', 'integer'],
            'attachments.*.type' => ['required_with:attachments.*.file_name', 'string', 'max:50'],
            'attachments.*.file_name' => ['required_with:attachments', 'string', 'max:255'],
            'attachments.*.mime_type' => ['nullable', 'string', 'max:255'],
            'attachments.*.size_bytes' => ['nullable', 'integer', 'min:0', 'max:1073741824'],
            'attachments.*.duration_seconds' => ['nullable', 'integer', 'min:0'],
            'attachments.*.url' => ['nullable', 'url', 'max:2048'],
            'attachments.*.metadata' => ['nullable', 'array'],
            'client_message_id' => ['nullable', 'string', 'max:255'],
            'is_announcement' => ['nullable', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'body.required' => 'محتوى الرسالة مطلوب.',
            'body.max' => 'محتوى الرسالة يجب ألا يتجاوز 10000 حرف.',
            'content_type.required' => 'نوع المحتوى مطلوب.',
            'content_type.in' => 'نوع المحتوى غير مدعوم.',
            'thread_id.integer' => 'معرّف الموضوع يجب أن يكون رقماً.',
            'parent_message_id.integer' => 'معرّف الرسالة الأصلية يجب أن يكون رقماً.',
            'reply_to_message_id.integer' => 'معرّف الرسالة المردود عليها يجب أن يكون رقماً.',
            'mentions.array' => 'قائمة الإشارات غير صالحة.',
            'mentions.max' => 'لا يمكن الإشارة لأكثر من 20 عضواً في رسالة واحدة.',
            'mentions.*.integer' => 'معرّف العضو المُشار إليه يجب أن يكون رقماً.',
            'mentions.*.exists' => 'أحد الأعضاء المُشار إليهم غير موجود.',
            'attachments.array' => 'قائمة المرفقات غير صالحة.',
            'attachments.max' => 'لا يمكن إرفاق أكثر من 10 ملفات.',
            'attachments.*.file_name.required_with' => 'اسم الملف المرفق مطلوب.',
            'attachments.*.file_name.max' => 'اسم الملف المرفق يجب ألا يتجاوز 255 حرفاً.',
            'attachments.*.size_bytes.max' => 'حجم الملف المرفق يتجاوز الحد المسموح.',
            'attachments.*.url.url' => 'رابط المرفق غير صالح.',
            'client_message_id.max' => 'معرّف الرسالة المؤقت يجب ألا يتجاوز 255 حرفاً.',
            'is_announcement.boolean' => 'قيمة الإعلان يجب أن تكون صحيحة أو خاطئة.',
        ];
    }
}
