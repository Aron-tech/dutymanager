<?php

namespace App\Http\Middleware;

use App\Models\Guild;
use App\Models\User;
use App\Services\SelectedGuildService;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class InitializeApiContextMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user_id = $request->header('user-id');

        if ($user_id) {
            $user = User::find($user_id);

            if ($user) {
                Auth::login($user);
            } else {
                return response()->json(['message' => __('app.error_no_permission')], 404);
            }
        } else {
            return response()->json(['message' => 'Missing user_id header'], 400);
        }

        $guild = once(function () use ($request) {
            if ($resolved = SelectedGuildService::get()) {
                return $resolved;
            }

            $route_guild = $request->route('guild');

            if ($route_guild instanceof Guild) {
                SelectedGuildService::set($route_guild);

                return $route_guild;
            }

            $guild_id = $request->input('guild_id')
                ?? $request->header('guild_id')
                ?? (is_scalar($route_guild) ? $route_guild : null);

            if ($guild_id) {
                $guild = Guild::find($guild_id);
                if ($guild) {
                    SelectedGuildService::set($guild);
                }

                return $guild;
            }

            return null;
        });

        if ($guild && ! $guild->is_installed) {
            return response()->json(['message' => 'Nincs telepítve a discord bot.'], 403);
        }

        return $next($request);
    }
}
