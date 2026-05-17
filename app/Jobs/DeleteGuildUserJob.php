<?php

namespace App\Jobs;

use App\Actions\DeleteGuildUserAction;
use App\Models\GuildUser;
use Illuminate\Bus\Batchable;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class DeleteGuildUserJob implements ShouldQueue
{
    use Batchable, Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public GuildUser $guild_user, public string $causer_id, public bool $should_kick = false) {}

    public function handle(): bool
    {
        if ($this->batch()?->cancelled()) {
            return false;
        }

        return DeleteGuildUserAction::run($this->guild_user, $this->causer_id, $this->should_kick);
    }
}
