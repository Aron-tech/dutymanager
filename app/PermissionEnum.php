<?php

namespace App;

enum PermissionEnum: string
{
    case ADD_USERS_TO_GUILD = 'add_users_to_guild';

    /**
     * @return array
     */
    public static function getOptions(): array
    {
        return array_column(self::cases(), 'value');
    }

    /**
     * @param string|null $lang
     * @return string
     */
    public function getLabel(?string $lang = null): string
    {
        return match ($this) {
            self::ADD_USERS_TO_GUILD => __('enum.add_users_to_guild', [], $lang),
        };
    }
}
