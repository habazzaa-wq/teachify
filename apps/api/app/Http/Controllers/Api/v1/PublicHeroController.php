<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Models\TenantSetting;
use Illuminate\Http\JsonResponse;

class PublicHeroController extends Controller
{
    public function index(): JsonResponse
    {
        $tenantId = currentTenant()->id;

        $setting = TenantSetting::query()
            ->where('tenant_id', $tenantId)
            ->where('group', 'homepage')
            ->first();

        $values = $setting?->values ?? [];

        $hero = [
            'title' => $values['hero']['title'] ?? 'مرحباً بكم',
            'subtitle' => $values['hero']['subtitle'] ?? '',
            'teacherImage' => $values['hero']['teacherImage'] ?? '',
            'teacherName' => $values['hero']['teacherName'] ?? '',
            'badge1Text' => $values['hero']['badge1Text'] ?? 'معلم محترف',
            'badge2Text' => $values['hero']['badge2Text'] ?? '',
            'isActive' => $values['hero']['isActive'] ?? true,
            'bgStyle' => $values['hero']['bgStyle'] ?? 'math',
            'socialLinks' => [
                'facebook' => $values['hero']['socialLinks']['facebook'] ?? '',
                'youtube' => $values['hero']['socialLinks']['youtube'] ?? '',
                'phone' => $values['hero']['socialLinks']['phone'] ?? '',
                'whatsapp' => $values['hero']['socialLinks']['whatsapp'] ?? '',
            ],
            'icons' => [
                'gifts' => [
                    'label' => $values['hero']['icons']['gifts']['label'] ?? 'الهدايا',
                    'visible' => $values['hero']['icons']['gifts']['visible'] ?? true,
                ],
                'facebook' => [
                    'label' => $values['hero']['icons']['facebook']['label'] ?? 'فيس بوك',
                    'visible' => $values['hero']['icons']['facebook']['visible'] ?? true,
                ],
                'chat' => [
                    'label' => $values['hero']['icons']['chat']['label'] ?? 'محادثة مباشرة',
                    'visible' => $values['hero']['icons']['chat']['visible'] ?? true,
                ],
                'youtube' => [
                    'label' => $values['hero']['icons']['youtube']['label'] ?? 'يوتيوب',
                    'visible' => $values['hero']['icons']['youtube']['visible'] ?? true,
                ],
                'bestStudents' => [
                    'label' => $values['hero']['icons']['bestStudents']['label'] ?? 'أفضل الطلاب',
                    'visible' => $values['hero']['icons']['bestStudents']['visible'] ?? true,
                ],
                'phone' => [
                    'label' => $values['hero']['icons']['phone']['label'] ?? 'رقم الهاتف',
                    'visible' => $values['hero']['icons']['phone']['visible'] ?? true,
                ],
            ],
        ];

        return response()->json(['hero' => $hero]);
    }
}
