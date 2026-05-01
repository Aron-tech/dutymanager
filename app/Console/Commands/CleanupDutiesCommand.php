<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\Command\CleanupService;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Symfony\Component\Console\Command\Command as CommandAlias;
use Throwable;

#[Signature('app:cleanup-duties-command {--loud : Output progress information}')]
#[Description('Command description')]
class CleanupDutiesCommand extends Command
{
    /**
     * @param CleanupService $cleanup_service
     * @return int
     * @throws Throwable
     */
    public function handle(CleanupService $cleanup_service): int
    {
        $is_loud = $this->option('loud');
        $invalid_limit = now()->subMonth();

        if ($is_loud) {
            $this->info('Automatic old duties deleting started.');
        }

        try {
            $deleted_count = $cleanup_service->purgeOldDuties($invalid_limit);

            if ($is_loud) {
                $this->info('Deleted '.$deleted_count.' old duties.');
            }

            return CommandAlias::SUCCESS;
        } catch (Throwable $e) {
            $this->error('Failed to purge old duties: '.$e->getMessage());

            return CommandAlias::FAILURE;
        }
    }
}
