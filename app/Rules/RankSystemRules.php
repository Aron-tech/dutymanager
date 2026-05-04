<?php

declare(strict_types=1);

namespace App\Rules;

final class RankSystemRules
{
    /**
     * @return array<string, array<int, string>>
     */
    public static function rules(): array
    {
        return [
            'settings.rank_system' => ['required', 'array'],
            'settings.rank_system.ordered_ranks' => ['required', 'array'],
            'settings.rank_system.ordered_ranks.*' => ['required', 'string'],
            'settings.rank_system.announcement_channel_id' => ['nullable', 'string'],
            'settings.rank_system.log_channel_id' => ['required', 'string'],
            'settings.rank_system.archive_duties_on_promotion' => ['nullable', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public static function messages(): array
    {
        return [
            'settings.rank_system.ordered_ranks.required' => 'A ranglétra megadása kötelező.',
            'settings.rank_system.log_channel_id.required' => 'A log szoba megadása kötelező.',
        ];
    }
}
