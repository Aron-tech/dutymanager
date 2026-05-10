<?php

declare(strict_types=1);

namespace App\Rules;

final class WarningSystemRules
{
    /**
     * @return array<string, array<int, string>>
     */
    public static function rules(string $prefix = 'settings.warning_system'): array
    {
        return [
            "{$prefix}.warning_roles" => ['required', 'array', 'min:1'],
            "{$prefix}.warning_roles.*" => ['required', 'string'],
            "{$prefix}.announcement_channel_id" => ['nullable', 'string'],
            "{$prefix}.announcement_message" => ['required_with:'.$prefix.'.announcement_channel_id', 'string'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public static function messages(string $prefix = 'settings.warning_system'): array
    {
        return [
            "{$prefix}.warning_roles.required" => 'Legalább egy figyelmeztetési rang megadása kötelező.',
            "{$prefix}.warning_roles.min" => 'Legalább egy figyelmeztetési rangot ki kell választani.',
            "{$prefix}.announcement_message.required_with" => 'A felhívás üzenet kitöltése kötelező, ha van felhívás szoba kiválasztva.',
        ];
    }
}
