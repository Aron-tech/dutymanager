<?php

namespace App\Observers;

use App\Models\Duty;

class DutyObserver
{
    /**
     * Handle the Duty "created" event.
     */
    public function created(Duty $duty): void
    {
        //
    }

    /**
     * Handle the Duty "updated" event.
     */
    public function updated(Duty $duty): void
    {
        //
    }

    /**
     * Handle the Duty "deleted" event.
     */
    public function deleted(Duty $duty): void
    {
        //
    }

    /**
     * Handle the Duty "restored" event.
     */
    public function restored(Duty $duty): void
    {
        //
    }

    /**
     * Handle the Duty "force deleted" event.
     */
    public function forceDeleted(Duty $duty): void
    {
        //
    }
}
