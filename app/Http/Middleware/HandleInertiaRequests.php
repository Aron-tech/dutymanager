<?php

namespace App\Http\Middleware;

use App\Enums\GlobalRoleEnum;
use App\Services\SelectedGuildService;
use Illuminate\Http\Request;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $permissions = [];
        $user = $request->user();

        if ($user) {
            if ($user->global_role == GlobalRoleEnum::DEVELOPER) {
                $permissions = ['*'];
            } else {
                $guild = SelectedGuildService::get();
                if ($guild) {
                    if ($guild->owner_id == $user->id) {
                        $permissions = ['*'];
                    } else {
                        $guild_user = $guild->acceptedGuildUsers()->where('user_id', $user->id)->first();
                        if ($guild_user) {
                            if ($guild_user->global_role == GlobalRoleEnum::ADMIN) {
                                $permissions = ['*'];
                            } else {
                                $permissions = $guild_user->getPermissionsAttribute();
                            }
                        }
                    }
                }
            }
        }

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $user,
                'permissions' => $permissions,
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'activeGuild' => $request->session()->get('selected_guild_id'),
            'ziggy' => fn () => [
                ...(new Ziggy)->toArray(),
                'location' => $request->url(),
            ],
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
            ],
        ];
    }
}
