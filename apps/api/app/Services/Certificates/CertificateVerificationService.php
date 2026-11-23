<?php

namespace App\Services\Certificates;

use App\Models\CertificateVerification;

class CertificateVerificationService
{
    /**
     * @return array<string, mixed>
     */
    public function verify(string $code): array
    {
        $verification = CertificateVerification::withoutGlobalScopes()
            ->where('verification_code', $code)
            ->with([
                'certificate' => fn ($query) => $query->withoutGlobalScopes(),
                'certificate.course' => fn ($query) => $query->withoutGlobalScopes(),
                'certificate.student.user',
            ])
            ->first();

        if (! $verification || ! $verification->certificate) {
            return ['valid' => false];
        }

        $verification->forceFill(['verified_at' => now()])->save();

        $certificate = $verification->certificate;

        return [
            'valid' => $certificate->status === 'issued',
            'issued_at' => $certificate->issued_at,
            'course_title' => $certificate->snapshot_data['course_title'] ?? $certificate->course?->title,
            'learner_display_name' => $certificate->snapshot_data['student_name'] ?? $certificate->student?->user?->name,
            'instructor_name' => $certificate->snapshot_data['instructor_name'] ?? null,
            'certificate_number' => $certificate->certificate_number,
            'reference_number' => $certificate->reference_number,
            'certificate_status' => $certificate->status,
            'snapshot' => $certificate->snapshot_data,
        ];
    }
}
