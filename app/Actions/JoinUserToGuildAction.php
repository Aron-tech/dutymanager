<?php

namespace App\Actions;

use App\Models\Guild;
use App\Models\GuildUser;
use App\Models\User;
use Lorisleiva\Actions\Concerns\AsAction;

class JoinUserToGuildAction
{
    use AsAction;

    public function handle(User $user, Guild $guild, string $ic_name, array $details, bool $is_request, ?User $added_by): GuildUser
    {
        $guild_user = GuildUser::create([
            'user_id' => $user->id,
            'guild_id' => $guild->id,
            'ic_name' => $ic_name,
            'details' => $details,
            'is_request' => $is_request,
            'accepted_at' => $added_by ? now() : null,
            'added_by' => $added_by,
        ]);

        return $guild_user;
    }
}
