<?php

namespace App;

enum ActionTypeEnum: string
{
    case FIRST_LOGIN_TO_WEBSITE = 'first_login_to_website';
    case JOIN_TO_GUILD = 'join_to_guild';
    case LEAVE_FROM_GUILD = 'leave_from_guild';
    case SETUP_GUILD = 'setup_guild';

    /**
     * @return array
     */
    public static function getOptions(): array
    {
        return array_column(self::cases(), 'value');
    }
}
