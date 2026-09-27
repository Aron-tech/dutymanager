<?php

namespace App\Http\Middleware;

use App\Models\Image;
use App\Services\SelectedGuildService;
use Closure;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Prevents accessing route-bound models (guild users, duties, punishments, exams, ...)
 * that belong to a different guild than the currently selected one.
 */
class EnsureRouteModelsBelongToSelectedGuild
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $guild_id = SelectedGuildService::get()?->id;

        foreach ($request->route()?->parameters() ?? [] as $parameter) {
            if (! $parameter instanceof Model) {
                continue;
            }

            $owner_guild_id = $this->resolveOwnerGuildId($parameter);

            if ($owner_guild_id !== null && $owner_guild_id !== $guild_id) {
                abort(404);
            }
        }

        return $next($request);
    }

    private function resolveOwnerGuildId(Model $model): ?string
    {
        if ($model instanceof Image) {
            $owner_guild_id = $model->imageable?->getAttribute('guild_id');

            return $owner_guild_id === null ? null : (string) $owner_guild_id;
        }

        $owner_guild_id = $model->getAttribute('guild_id');

        return $owner_guild_id === null ? null : (string) $owner_guild_id;
    }
}
