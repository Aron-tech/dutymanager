<?php

namespace App\Http\Middleware;

use App\Services\SelectedGuildService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RequireGuildSetupMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $guild = SelectedGuildService::get();

        if (! $guild) {
            return to_route('guilds.selector');
        }

        $is_setup_route = $request->routeIs('guild.setup.*');

        if (! $guild->is_installed && ! $is_setup_route) {
            return redirect()->route('guild.setup.show', $guild->id);
        }

        if ($guild->is_installed && $is_setup_route) {
            return redirect()->route('dashboard');
        }

        return $next($request);
    }
}
