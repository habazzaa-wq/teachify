<?php

namespace App\Services\Auth;

use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;

class GoogleAuthService
{
    /**
     * @return array{sub:string,email:string,email_verified:bool,name:string,picture:?string,birth_date:?string}
     */
    public function profileFromAccessToken(string $accessToken): array
    {
        $response = Http::timeout(10)
            ->withToken($accessToken)
            ->acceptJson()
            ->get('https://www.googleapis.com/oauth2/v3/userinfo');

        if (! $response->successful()) {
            throw ValidationException::withMessages([
                'google' => ['تعذر التحقق من حساب Google. حاول مرة أخرى.'],
            ]);
        }

        $data = $response->json();
        $sub = (string) ($data['sub'] ?? '');
        $email = trim((string) ($data['email'] ?? ''));

        if ($sub === '' || $email === '') {
            throw ValidationException::withMessages([
                'google' => ['لم نتمكن من قراءة بيانات حساب Google.'],
            ]);
        }

        $emailVerified = filter_var($data['email_verified'] ?? false, FILTER_VALIDATE_BOOLEAN);
        if (! $emailVerified) {
            throw ValidationException::withMessages([
                'google' => ['يجب تأكيد البريد الإلكتروني في حساب Google أولاً.'],
            ]);
        }

        $birthDate = $this->fetchBirthDate($accessToken);

        return [
            'sub' => $sub,
            'email' => mb_strtolower($email),
            'email_verified' => true,
            'name' => trim((string) ($data['name'] ?? '')) ?: $email,
            'picture' => isset($data['picture']) ? (string) $data['picture'] : null,
            'birth_date' => $birthDate,
        ];
    }

    private function fetchBirthDate(string $accessToken): ?string
    {
        $response = Http::timeout(10)
            ->withToken($accessToken)
            ->acceptJson()
            ->get('https://people.googleapis.com/v1/people/me', [
                'personFields' => 'birthdays',
            ]);

        if (! $response->successful()) {
            return null;
        }

        $birthdays = $response->json('birthdays', []);
        if (! is_array($birthdays)) {
            return null;
        }

        foreach ($birthdays as $birthday) {
            $date = $birthday['date'] ?? null;
            if (! is_array($date)) {
                continue;
            }
            $year = $date['year'] ?? null;
            $month = $date['month'] ?? null;
            $day = $date['day'] ?? null;
            if ($year && $month && $day) {
                return sprintf('%04d-%02d-%02d', (int) $year, (int) $month, (int) $day);
            }
        }

        return null;
    }
}
