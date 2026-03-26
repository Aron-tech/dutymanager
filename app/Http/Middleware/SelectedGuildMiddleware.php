<?php

namespace App\Http\Middleware;

use App\Services\SelectedGuildService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SelectedGuildMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->session()->has(SelectedGuildService::SESSION_KEY)) {
            return redirect()->route('guilds.selector');
        }

        return $next($request);
    }
}
