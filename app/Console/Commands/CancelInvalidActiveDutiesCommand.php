<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\Command\CleanupService;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Symfony\Component\Console\Command\Command as CommandAlias;
use Throwable;

#[Signature('app:cancel-invalid-active-duties-command {--loud : Output progress information}')]
#[Description('Command description')]
class CancelInvalidActiveDutiesCommand extends Command
{
    /**
     * @param CleanupService $cleanup_service
     * @return int
     * @throws Throwable
     */
    public function handle(CleanupService $cleanup_service): int
    {
        $is_loud = $this->option('loud');
        $invalid_limit = now()->subHours(14);

        if ($is_loud) {
            $this->info('Automatic canceling invalid duties started.');
        }

        try {
            $deleted_count = $cleanup_service->cancelInvalidActiveDuties($invalid_limit);

            if ($is_loud) {
                $this->info('Canceled '.$deleted_count.' invalid active duties.');
            }

            return CommandAlias::SUCCESS;
        } catch (Throwable $e) {
            $this->error('Failed to cancel invalid active duties: '.$e->getMessage());

            return CommandAlias::FAILURE;
        }
    }
}
