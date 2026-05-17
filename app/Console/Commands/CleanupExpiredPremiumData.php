<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\Command\CleanupService;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Symfony\Component\Console\Command\Command as CommandAlias;
use Throwable;

#[Signature('app:cleanup-expired-premium-data {--loud : Output progress information}')]
#[Description('Cleans up excess user details and configs for guilds with expired premium.')]
class CleanupExpiredPremiumData extends Command
{
    /**
     * @param CleanupService $cleanup_service
     * @return int
     * @throws Throwable
     */
    public function handle(CleanupService $cleanup_service): int
    {
        $is_loud = $this->option('loud');

        if ($is_loud) {
            $this->info('Automatic expired premium data cleanup started.');
        }

        try {
            $processed_count = $cleanup_service->purgeExpiredPremiumData();

            if ($is_loud) {
                $this->info('Processed guild count: '.$processed_count);
            }

            return CommandAlias::SUCCESS;
        } catch (Throwable $e) {
            $this->error('Failed to cleanup expired premium data: '.$e->getMessage());

            return CommandAlias::FAILURE;
        }
    }
}
