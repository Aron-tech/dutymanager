<?php

namespace App\Actions;

use App\Enums\ActionTypeEnum;
use App\Jobs\RemoveDiscordRoleJob;
use App\Models\ActivityLog;
use App\Models\GuildUser;
use App\Services\DiscordFetchService;
use Illuminate\Support\Facades\DB;
use Lorisleiva\Actions\Concerns\AsAction;

class DeleteGuildUserAction
{
    use AsAction;

    public function handle(GuildUser $guild_user, string $causer_id, bool $should_kick = false): bool
    {
        $guild_id = $guild_user->guild_id;
        $user_id = $guild_user->user_id;
        $role_ids = $guild_user->cached_roles ?? [];

        $is_deleted = DB::transaction(function () use ($guild_user, $causer_id) {
            ActivityLog::make(
                $guild_user->guild_id,
                $causer_id,
                $guild_user->user_id,
                ActionTypeEnum::DELETE_USER_FROM_GUILD,
                $guild_user->toArray()
            );

            return $guild_user->delete();
        });

        if ($should_kick) {
            DiscordFetchService::kickMember($guild_id, $user_id);
            return $is_deleted;
        }

        if ($is_deleted && ! empty($role_ids)) {
            RemoveDiscordRoleJob::dispatch($guild_id, $user_id, $role_ids);
        }

        return $is_deleted;
    }
}
