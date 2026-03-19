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
}
