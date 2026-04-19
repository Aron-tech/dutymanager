<?php

namespace App\Observers;

use App\Models\GuildUser;

class GuildUserObserver
{
    public function deleting(GuildUser $guildUser): void
    {
        $guildUser->duties()->update(['guild_user_id' => null]);
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
