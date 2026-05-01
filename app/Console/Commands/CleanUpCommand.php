<?php

declare(strict_types=1);

namespace App\Console\Commands;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Symfony\Component\Console\Command\Command as CommandAlias;

#[Signature('app:clean-up-command {--loud : Output progress information}')]
#[Description('Run all cleanup operations')]
class CleanUpCommand extends Command
{
    public function handle(): int
    {
        $options = [];
        if ($this->option('loud')) {
            $options['--loud'] = true;
        }

        $this->call('app:cleanup-duties-command', $options);
        $this->call('app:cleanup-punishments-command', $options);
        $this->call('app:cleanup-holidays-command', $options);

        return CommandAlias::SUCCESS;
    }
}
