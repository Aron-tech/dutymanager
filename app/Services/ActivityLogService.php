<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\Guild;
use Illuminate\Pagination\LengthAwarePaginator;

class ActivityLogService
{
    public function getPaginatedLogs(Guild $guild, array $filters = []): LengthAwarePaginator
    {
        $search_query = $filters['search'] ?? null;
        $per_page = $filters['per_page'] ?? 20;
        $sort = $filters['sort'] ?? 'created_at';
        $direction = strtolower($filters['direction'] ?? 'desc') === 'asc' ? 'asc' : 'desc';

        $query = ActivityLog::query()
            ->select('activity_logs.*')
            ->leftJoin('guild_users as actors', function ($join) use ($guild) {
                $join->on('activity_logs.user_id', '=', 'actors.user_id')
                    ->where('actors.guild_id', '=', $guild->id);
            })
            ->leftJoin('users as actor_users', 'activity_logs.user_id', '=', 'actor_users.id')
            ->leftJoin('guild_users as targets', function ($join) use ($guild) {
                $join->on('activity_logs.target_id', '=', 'targets.user_id')
                    ->where('targets.guild_id', '=', $guild->id);
            })
            ->leftJoin('users as target_users', 'activity_logs.target_id', '=', 'target_users.id')
            ->where('activity_logs.guild_id', $guild->id)
            ->with(['actor:id,name', 'target:id,name']);

        if ($search_query) {
            $query->where(function ($q) use ($search_query) {
                $q->where('activity_logs.action', 'like', "%{$search_query}%")
                    ->orWhere('actor_users.name', 'like', "%{$search_query}%")
                    ->orWhere('actors.user_id', 'like', "%{$search_query}%")
                    ->orWhere('actors.ic_name', 'like', "%{$search_query}%")
                    ->orWhere('target_users.name', 'like', "%{$search_query}%")
                    ->orWhere('targets.user_id', 'like', "%{$search_query}%")
                    ->orWhere('targets.ic_name', 'like', "%{$search_query}%");
            });
        }

        switch ($sort) {
            case 'action':
                $query->orderBy('activity_logs.action', $direction);
                break;
            case 'actor_discord_name':
                $query->orderBy('actor_users.name', $direction);
                break;
            case 'actor_discord_id':
                $query->orderBy('activity_logs.user_id', $direction);
                break;
            case 'target_discord_name':
                $query->orderBy('target_users.name', $direction);
                break;
            case 'target_discord_id':
                $query->orderBy('activity_logs.target_id', $direction);
                break;
            case 'created_at':
                $query->orderBy('activity_logs.created_at', $direction);
                break;
            default:
                $query->orderBy('activity_logs.created_at', $direction);
                break;
        }

        return $query->paginate($per_page)->withQueryString();
    }
}
