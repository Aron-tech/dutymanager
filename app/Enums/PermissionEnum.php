<?php

namespace App\Enums;

enum PermissionEnum: string
{
    // Összes jogosultság
    case ALL = 'all';

    // Sima guild user információk
    case ADD_GUILD_USERS = 'add_guild_users';
    case EDIT_GUILD_USERS = 'edit_guild_users';
    case DELETE_GUILD_USERS = 'delete_guild_users';

    // Szolgálat kezelése
    case ADD_DUTIES = 'add_duties';
    case EDIT_DUTIES = 'edit_duties';
    case DELETE_DUTIES = 'delete_duties';

    // Punishment kezelése
    case ADD_PUNISHMENTS = 'add_punishments';
    case ADD_BLACKLIST = 'add_blacklist';
    case ADD_WARNING = 'add_warning';
    case ADD_VERBAL_WARNING = 'add_verbal_warning';
    case DELETE_PUNISHMENTS = 'delete_punishments';
    case DELETE_BLACKLIST = 'delete_blacklist';
    case DELETE_WARNING = 'delete_warning';
    case DELETE_VERBAL_WARNING = 'delete_verbal_warning';

    // Megtekintési jogok
    case VIEW_GUILD_SETTINGS = 'view_guild_settings';
    case VIEW_GUILD_USERS = 'view_guild_users';
    case VIEW_DUTIES = 'view_duties';
    case VIEW_DUTIES_STATS = 'view_duties_stats';
    case VIEW_PUNISHMENTS = 'view_punishments';

    // Szerver szintű jogok
    case EDIT_SETTINGS = 'edit_settings';

    // Alap jogosultságok
    case TOGGLE_DUTY = 'toggle_duty';
    case GET_HOLIDAY = 'get_holiday';
    case CANCEL_HOLIDAY = 'cancel_holiday';

    public static function getOptions(): array
    {
        return array_column(self::cases(), 'value');
    }

    public function getLabel(?string $lang = null): string
    {
        return __('permission.'.$this->value, [], $lang);
    }
}
