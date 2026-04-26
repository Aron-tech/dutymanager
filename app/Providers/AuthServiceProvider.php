<?php

namespace App\Providers;

use App\Enums\GlobalRoleEnum;
use App\Models\Guild;
use App\Models\User;
use App\Services\SelectedGuildService;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Gate::before(function (User $user, string $ability) {

            if ($user->global_role == GlobalRoleEnum::DEVELOPER) {
                return true;
            }

            $guild = SelectedGuildService::get();

            if (! $guild) {
                $guild_id = request()->input('guild_id')
                        ?? request()->header('X-Guild-ID')
                        ?? request()->route('guild')?->id;

                if ($guild_id) {
                    $guild = Guild::find($guild_id);
                }
            }

            if (! $guild) {
                return null;
            }

            $guild_user = $guild->acceptedGuildUsers()->where('user_id', $user->id)->first();

            if (! $guild_user) {
                return false;
            }

            if ($guild_user->global_role == GlobalRoleEnum::ADMIN) {
                return true;
            }

            $permissions = $guild_user->getPermissionsAttribute();

            if (empty($permissions)) {
                return false;
            }

            return in_array($ability, $permissions);
        });
    }
}
