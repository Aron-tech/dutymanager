<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class VerifyApiTokenMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $expected_token = config('services.api_key');
        $provided_token = $request->bearerToken();

        if ($provided_token !== $expected_token) {
            return response()->json(['error' => __('app.error_invalid_api_key')], 401);
        }

        return $next($request);
    }
}
