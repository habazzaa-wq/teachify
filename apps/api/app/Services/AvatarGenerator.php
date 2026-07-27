<?php

namespace App\Services;

class AvatarGenerator
{
    private const DICEBEAR_BASE_URL = 'https://api.dicebear.com/9.x/adventurer/svg';

    private const MALE_SEEDS = [
        'James', 'Liam', 'Oliver', 'Ethan', 'Lucas',
        'Mason', 'Logan', 'Alexander', 'Aiden', 'Henry',
    ];

    private const FEMALE_SEEDS = [
        'Emma', 'Olivia', 'Ava', 'Sophia', 'Isabella',
        'Mia', 'Charlotte', 'Amelia', 'Harper', 'Evelyn',
    ];

    public static function generate(?string $gender, int $seed = null): string
    {
        $seedValue = $seed ?? random_int(1, 100000);

        $genderLower = strtolower(trim($gender ?? ''));

        if (in_array($genderLower, ['ذكر', 'male', 'm', 'انثى', 'أنثى', 'female', 'f'])) {
            $isFemale = in_array($genderLower, ['أنثى', 'انثى', 'female', 'f']);

            $seeds = $isFemale ? self::FEMALE_SEEDS : self::MALE_SEEDS;
            $baseSeed = $seeds[$seedValue % count($seeds)];
            $finalSeed = $baseSeed . '-' . $seedValue;
        } else {
            $finalSeed = 'student-' . $seedValue;
        }

        return self::DICEBEAR_BASE_URL . '?' . http_build_query([
            'seed' => $finalSeed,
            'size' => '128',
            'radius' => '50',
            'backgroundColor' => 'b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf',
        ]);
    }
}
