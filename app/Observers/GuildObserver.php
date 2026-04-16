<?php

namespace App\Observers;

use App\Models\Guild;

class GuildObserver
{
    /**
     * Handle the Guild "created" event.
     */
    public function created(Guild $guild): void
    {
        //
    }

    /**
     * Handle the Guild "updated" event.
     */
    public function updated(Guild $guild): void
    {
        //
    }

    /**
     * Handle the Guild "deleted" event.
     */
    public function deleted(Guild $guild): void
    {
        $guild->guildUsers()->delete();
    }

    /**
     * Handle the Guild "restored" event.
     */
    public function restored(Guild $guild): void
    {
        //
    }

    /**
     * Handle the Guild "force deleted" event.
     */
    public function forceDeleted(Guild $guild): void
    {
        //
    }
}
