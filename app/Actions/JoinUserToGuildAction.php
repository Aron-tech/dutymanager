<?php

namespace App\Actions;

use App\Enums\ActionTypeEnum;
use App\Models\ActivityLog;
use App\Models\Duty;
use App\Models\Guild;
use App\Models\GuildUser;
use App\Models\Punishment;
use App\Models\User;
use Lorisleiva\Actions\Concerns\AsAction;

class JoinUserToGuildAction
{
    use AsAction;

    public function handle(User $user, Guild $guild, string $ic_name, array $details, bool $is_request, ?User $added_by, bool $use_restore = false): GuildUser
    {
        $guild_user = GuildUser::create([
            'user_id' => $user->id,
            'guild_id' => $guild->id,
            'ic_name' => $ic_name,
            'details' => $details,
            'is_request' => $is_request,
            'accepted_at' => $added_by ? now() : null,
            'added_by' => $added_by?->id,
        ]);

        if ($is_request) {
            ActivityLog::make($guild->id, $user->id, null, ActionTypeEnum::REQUEST_JOIN_GUILD, $guild_user->toArray());
        } elseif ($use_restore) {
            $this->restore($guild_user);
            ActivityLog::make($guild->id, $added_by->id, $user->id, ActionTypeEnum::ADD_USER_TO_GUILD_WITH_RESTORE, $guild_user->toArray());
        } else {
            ActivityLog::make($guild->id, $added_by->id, $user->id, ActionTypeEnum::ADD_USER_TO_GUILD, $guild_user->toArray());
        }

        return $guild_user;
    }

    private function restore(GuildUser $guild_user): void
    {
        Duty::where('guild_id', $guild_user->guild_id)->where('user_id', $guild_user->user_id)->update(['guild_user_id' => $guild_user->id]);
        Punishment::where('guild_id', $guild_user->guild_id)->where('user_id', $guild_user->user_id)->update(['guild_user_id' => $guild_user->id]);
    }
}
