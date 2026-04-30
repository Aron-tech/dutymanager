<?php

namespace App\Enums;

enum PermissionEnum: string
{
    // Kategórizálás
    const string USER_GROUP = 'user_group';

    const string MODERATOR_GROUP = 'moderator_group';

    const string ADMIN_GROUP = 'admin_group';

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
    case VIEW_LOGS = 'view_logs';

    // Szerver szintű jogok
    case EDIT_SETTINGS = 'edit_settings';

    // Alap jogosultságok
    case TOGGLE_DUTY = 'toggle_duty';
    case GET_HOLIDAY = 'get_holiday';
    case CANCEL_HOLIDAY = 'cancel_holiday';
    case MAKE_REQUEST = 'make_request';

    public static function getOptions(): array
    {
        return array_column(self::cases(), 'value');
    }

    public function getLabel(?string $lang = null): string
    {
        return __('permission.'.$this->value, [], $lang);
    }

    public function getGroupPermissions(string $group): array
    {
        $default_permissions = [
            PermissionEnum::TOGGLE_DUTY,
            PermissionEnum::CANCEL_HOLIDAY,
            PermissionEnum::GET_HOLIDAY,
            PermissionEnum::MAKE_REQUEST,
        ];

        switch ($group) {
            case PermissionEnum::USER_GROUP:
                return $default_permissions;
            case PermissionEnum::MODERATOR_GROUP:
                return array_merge($default_permissions, [
                    PermissionEnum::VIEW_GUILD_USERS,
                    PermissionEnum::VIEW_DUTIES,
                    PermissionEnum::VIEW_DUTIES_STATS,
                    PermissionEnum::VIEW_PUNISHMENTS,
                    PermissionEnum::ADD_DUTIES,
                    PermissionEnum::ADD_VERBAL_WARNING,
                    PermissionEnum::DELETE_VERBAL_WARNING,
                    PermissionEnum::ADD_WARNING,
                    PermissionEnum::DELETE_WARNING,
                ]);
            case PermissionEnum::ADMIN_GROUP:
                return [
                    PermissionEnum::ALL,
                ];
        }
    }
}
