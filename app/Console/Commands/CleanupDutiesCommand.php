<?php

namespace App\Console\Commands;

use App\Models\Duty;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('app:cleanup-duties-command')]
#[Description('Command description')]
class CleanupDutiesCommand extends Command
{
    /**
     * Execute the console command.
     */
    public function handle()
    {
        $invalid_limit = now()->addHours(14);

        Duty::activeDuties()->where('started_at', '>', $invalid_limit)->delete();
    }
}
