<?php

namespace App\Providers;

use App\Enums\GlobalRoleEnum;
use App\Enums\PermissionEnum;
use App\Models\Guild;
use App\Models\User;
use App\Services\GuildPermissionResolver;
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

            $permissions = GuildPermissionResolver::resolve($user, $guild);

            if ($permissions === null) {
                return false;
            }

            if (in_array(PermissionEnum::ALL->value, $permissions, true)) {
                return true;
            }

            return in_array($ability, $permissions, true);
        });
    }
}
