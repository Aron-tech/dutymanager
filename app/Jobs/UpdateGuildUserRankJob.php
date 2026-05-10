<?php

namespace App\Jobs;

use App\Actions\ChangeGuildUserRankAction;
use App\Models\Guild;
use App\Models\GuildSettings;
use App\Models\GuildUser;
use Illuminate\Bus\Batchable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class UpdateGuildUserRankJob implements ShouldQueue
{
    use Batchable, Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Create a new job instance.
     */
    public function __construct(public GuildUser $guildUser, public Guild $guild, public string $action, public int $level, public string $causer_id) {}

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        if ($this->batch()?->cancelled()) {
            return;
        }

        ChangeGuildUserRankAction::run($this->guildUser, $this->guild, $this->action, $this->level, $this->causer_id);
    }
}
