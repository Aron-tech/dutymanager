<?php

namespace App\Enums;

enum PermissionEnum: string
{
    case ADD_USERS_TO_GUILD = 'add_users_to_guild';
    case DELETE_USERS_FROM_GUILD = 'delete_users_from_guild';
    case EDIT_GUILD_USERS = 'edit_guild_users';
    case EDIT_GUILD_SETTINGS = 'edit_guild_settings';
    case EDIT_GUILD_USERS_DUTIES = 'edit_guild_users_duties';
    case VIEW_GUILD_USERS = 'view_guild_users';
    case VIEW_GUILD_SETTINGS = 'view_guild_settings';
    case VIEW_GUILD_DUTIES_STATS = 'view_guild_duties_stats';

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
            self::ADD_USERS_TO_GUILD => __('permission.add_users_to_guild', [], $lang),
            self::DELETE_USERS_FROM_GUILD => __('permission.delete_users_from_guild', [], $lang),
            self::EDIT_GUILD_USERS => __('permission.edit_guild_users', [], $lang),
            self::EDIT_GUILD_SETTINGS => __('permission.edit_guild_settings', [], $lang),
            self::EDIT_GUILD_USERS_DUTIES => __('permission.edit_guild_users_duties', [], $lang),
            self::VIEW_GUILD_USERS => __('permission.view_guild_users', [], $lang),
            self::VIEW_GUILD_SETTINGS => __('permission.view_guild_settings', [], $lang),
            self::VIEW_GUILD_DUTIES_STATS => __('permission.view_guild_duties_stats', [], $lang)
        };
    }
}
