<?php

namespace App\Providers;

use App\Enums\GlobalRoleEnum;
use App\Models\Guild;
use App\Models\User;
use App\Services\SelectedGuildService;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        Gate::before(function (User $user, string $ability) {

            if ($user->global_role === GlobalRoleEnum::DEVELOPER) {
                return true;
            }

            $guild = SelectedGuildService::get();

            if (! $guild) {
                $route_guild = request()->route('guild');

                if ($route_guild instanceof Guild) {
                    SelectedGuildService::set($route_guild);
                    $guild = $route_guild;
                } else {
                    $guild_id = request()->input('guild_id')
                        ?? request()->header('guild_id')
                        ?? (is_scalar($route_guild) ? $route_guild : null);

                    if ($guild_id) {
                        $guild = Guild::find($guild_id);
                        if ($guild) {
                            SelectedGuildService::set($guild);
                        }
                    }
                }
            }

            if (! $guild) {
                return null;
            }

            if ($guild->owner_id === $user->id) {
                return true;
            }

            $guild_user = $guild->acceptedGuildUsers()->where('user_id', $user->id)->first();

            if (! $guild_user) {
                return false;
            }

            if ($user->global_role === GlobalRoleEnum::ADMIN) {
                return true;
            }

            $permissions = $guild_user->permissions;

            if (empty($permissions)) {
                return false;
            }

            return in_array($ability, $permissions);
        });
    }
}
