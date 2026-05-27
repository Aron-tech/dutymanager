<?php

namespace App\Observers;

use App\Models\GuildUser;
use App\Services\DiscordFetchService;

class GuildUserObserver
{
    public function deleting(GuildUser $guildUser): void
    {
        GuildUser::deletePermissionCache($guildUser->guild_id, $guildUser->user_id);
        if (! empty($guildUser->cached_roles)) {
            foreach ($guildUser->cached_roles as $role_id) {
                DiscordFetchService::removeRoleFromMember($guildUser->guild_id, $guildUser->user_id, $role_id);
            }
        }
        $guildUser->duties()->withTrashed()->update(['guild_user_id' => null]);
        $guildUser->punishments()->withTrashed()->update(['guild_user_id' => null]);
        $guildUser->holidays()->update(['guild_user_id' => null]);
        $guildUser->images()->delete();
    }

    /**
     * Handle the GuildUser "created" event.
     */
    public function created(GuildUser $guildUser): void
    {
        //
    }

    /**
     * Handle the GuildUser "updated" event.
     */
    public function updated(GuildUser $guildUser): void
    {
        //
    }

    /**
     * Handle the GuildUser "deleted" event.
     */
    public function deleted(GuildUser $guildUser): void
    {
        //
    }

    /**
     * Handle the GuildUser "restored" event.
     */
    public function restored(GuildUser $guildUser): void
    {
        //
    }

    /**
     * Handle the GuildUser "force deleted" event.
     */
    public function forceDeleted(GuildUser $guildUser): void
    {
        //
    }
}
