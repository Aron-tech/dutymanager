<?php

namespace App\Console\Commands;

use App\Models\Duty;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

#[Signature('app:cleanup-duties-command {--loud : Output progress information}')]
#[Description('Command description')]
class CleanupDutiesCommand extends Command
{
    /**
     * Execute the console command.
     *
     * @return void
     * @throws \Throwable
     */
    public function handle(): void
    {
        $is_loud = $this->option('loud');
        $invalid_limit = now()->subHours(14);

        if ($is_loud) {
            $this->info('Automatic invalid duties deleting started.');
        }

        $deleted_duties = DB::transaction(function () use ($invalid_limit) {
            return Duty::query()->activeDuties()->where('started_at', '<', $invalid_limit)->delete();
        });

        if ($is_loud) {
            $this->info('Deleted '.$deleted_duties.' duty(ies).');
        }
    }
}
