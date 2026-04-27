<?php

namespace App\Http\Middleware;

use App\Models\User;
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

        return $next($request);
    }
}
