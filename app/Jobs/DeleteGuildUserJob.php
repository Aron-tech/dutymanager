<?php

namespace App\Jobs;

use App\Enums\ActionTypeEnum;
use App\Models\ActivityLog;
use App\Models\GuildUser;
use Illuminate\Bus\Batchable;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;

class DeleteGuildUserJob implements ShouldQueue
{
    use Batchable, Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public GuildUser $guild_user,
        public int $causer_id
    ) {}

    public function handle(): bool
    {
        if ($this->batch()?->cancelled()) {
            return false;
        }

        return DB::transaction(function () {
            ActivityLog::make($this->guild_user->guild_id, $this->causer_id, $this->guild_user->user_id, ActionTypeEnum::DELETE_USER_FROM_GUILD, $this->guild_user->toArray());

            return $this->guild_user->delete();
        });
    }
}
