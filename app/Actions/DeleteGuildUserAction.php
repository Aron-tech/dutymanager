<?php

namespace App\Actions;

use App\Enums\ActionTypeEnum;
use App\Models\ActivityLog;
use App\Models\GuildUser;
use Illuminate\Support\Facades\DB;
use Lorisleiva\Actions\Concerns\AsAction;

class DeleteGuildUserAction
{
    use AsAction;

    public function handle(GuildUser $guild_user, string $causer_id): bool
    {
        return DB::transaction(function () use ($guild_user, $causer_id) {
            ActivityLog::make(
                $guild_user->guild_id,
                $causer_id,
                $guild_user->user_id,
                ActionTypeEnum::DELETE_USER_FROM_GUILD,
                $guild_user->toArray()
            );

            return $guild_user->delete();
        });
    }
}
