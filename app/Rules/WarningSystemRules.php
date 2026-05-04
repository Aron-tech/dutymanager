<?php

declare(strict_types=1);

namespace App\Rules;

final class WarningSystemRules
{
    /**
     * @return array<string, array<int, string>>
     */
    public static function rules(): array
    {
        return [
            'settings.warning_system' => ['required', 'array'],
            'settings.warning_system.warning_roles' => ['required', 'array', 'min:1'],
            'settings.warning_system.warning_roles.*' => ['required', 'string'],
            'settings.warning_system.announcement_channel_id' => ['required', 'string'],
            'settings.warning_system.log_channel_id' => ['required', 'string'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public static function messages(): array
    {
        return [
            'settings.warning_system.warning_roles.required' => 'Legalább egy figyelmeztetési rang megadása kötelező.',
            'settings.warning_system.warning_roles.min' => 'Legalább egy figyelmeztetési rangot ki kell választani.',
            'settings.warning_system.announcement_channel_id.required' => 'A felhívás szoba kiválasztása kötelező.',
            'settings.warning_system.log_channel_id.required' => 'A log szoba kiválasztása kötelező.',
        ];
    }
}
