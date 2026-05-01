<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\Command\CleanupService;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Symfony\Component\Console\Command\Command as CommandAlias;
use Throwable;

#[Signature('app:cleanup-holidays-command {--loud : Output progress information}')]
#[Description('Purge old holidays securely.')]
class CleanupHolidaysCommand extends Command
{
    /**
     * @param CleanupService $cleanup_service
     *
     * @return int
     *
     * @throws Throwable
     */
    public function handle(CleanupService $cleanup_service): int
    {
        $is_loud = $this->option('loud');
        $invalid_limit = now()->subYear();

        if ($is_loud) {
            $this->info('Automatic old holidays deleting started.');
        }

        try {
            $deleted_count = $cleanup_service->purgeOldHolidays($invalid_limit);

            if ($is_loud) {
                $this->info('Deleted '.$deleted_count.' old holiday(s).');
            }

            return CommandAlias::SUCCESS;
        } catch (Throwable $e) {
            $this->error('Failed to purge old holidays: '.$e->getMessage());

            return CommandAlias::FAILURE;
        }
    }
}
