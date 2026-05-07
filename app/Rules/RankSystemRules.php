<?php

declare(strict_types=1);

namespace App\Rules;

final class RankSystemRules
{
    /**
     * @return array<string, array<int, string>>
     */
    public static function rules(string $prefix = 'settings.rank_system'): array
    {
        return [
            "{$prefix}.rank_roles" => ['required', 'array', 'min:2'],
            "{$prefix}.rank_roles.*" => ['required', 'string'],
            "{$prefix}.announcement_channel_id" => ['nullable', 'string'],
            "{$prefix}.log_channel_id" => ['required', 'string'],
            "{$prefix}.archive_duties_on_promotion" => ['nullable', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public static function messages(string $prefix = 'settings.rank_system'): array
    {
        return [
            "{$prefix}.rank_roles.required" => 'A ranglétra megadása kötelező.',
            "{$prefix}.rank_roles.min" => 'A ranglétrának legalább 2 rangból kell állnia.',
            "{$prefix}.log_channel_id.required" => 'A log szoba megadása kötelező.',
        ];
    }
}
