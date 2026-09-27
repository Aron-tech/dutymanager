<?php

namespace App\Services;

use App\Enums\GlobalRoleEnum;
use App\Enums\PermissionEnum;
use App\Models\Guild;
use App\Models\User;

/**
 * Single source of truth for "which permissions does this user have in this guild",
 * used by both AuthServiceProvider's Gate::before and HandleInertiaRequests so the
 * backend authorization and the UI-shared permissions can never drift apart.
 */
class GuildPermissionResolver
{
    /**
     * @return list<string>|null null means the user has no access to the guild at all
     *                           (not the owner, not a global admin/developer, not an accepted member)
     */
    public static function resolve(User $user, Guild $guild): ?array
    {
        if ($user->global_role === GlobalRoleEnum::DEVELOPER || $guild->owner_id === $user->id) {
            return [PermissionEnum::ALL->value];
        }

        $guild_user = $guild->acceptedGuildUsers()->where('user_id', $user->id)->first();

        if (! $guild_user) {
            return null;
        }

        if ($user->global_role === GlobalRoleEnum::ADMIN) {
            return [PermissionEnum::ALL->value];
        }

        return array_values($guild_user->getPermissionsAttribute());
    }
}
