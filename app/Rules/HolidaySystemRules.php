<?php

declare(strict_types=1);

namespace App\Rules;

final class HolidaySystemRules
{
    /**
     * @return array<string, array<int, string>>
     */
    public static function rules(string $prefix = 'settings.holiday_system'): array
    {
        return [
            "{$prefix}.holiday_role_id" => ['required', 'string'],
            "{$prefix}.announcement_channel_id" => ['nullable', 'string'],
            "{$prefix}.announcement_message" => ['required_with:'.$prefix.'.announcement_channel_id', 'string'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public static function messages(string $prefix = 'settings.holiday_system'): array
    {
        return [
            "{$prefix}.holiday_role_id.required" => 'A szabadság rang kiválasztása kötelező.',
            "{$prefix}.announcement_message.required_with" => 'A felhívás üzenet kitöltése kötelező, ha van felhívás szoba kiválasztva.',
        ];
    }
}
