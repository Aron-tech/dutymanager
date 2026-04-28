<?php

namespace App\Services;

use App\Enums\ActionTypeEnum;
use App\Models\ActivityLog;
use App\Models\Guild;
use App\Models\Holiday;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class HolidayService
{
    public function getPaginatedHolidays(Guild $guild, array $filters = []): LengthAwarePaginator
    {
        $search_query = $filters['search'] ?? null;
        $per_page = $filters['per_page'] ?? 20;
        $sort = $filters['sort'] ?? 'started_at';
        $direction = strtolower($filters['direction'] ?? 'desc') === 'asc' ? 'asc' : 'desc';

        $query = Holiday::query()
            ->withTrashed()
            ->select('holidays.*')
            ->join('guild_users', 'holidays.guild_user_id', '=', 'guild_users.id')
            ->join('users', 'guild_users.user_id', '=', 'users.id')
            ->where('holidays.guild_id', $guild->id)
            ->with(['guildUser.user:id,name']);

        if ($search_query) {
            $query->where(function ($q) use ($search_query) {
                $q->where('users.name', 'like', "%{$search_query}%")
                    ->orWhere('guild_users.user_id', 'like', "%{$search_query}%")
                    ->orWhere('guild_users.ic_name', 'like', "%{$search_query}%")
                    ->orWhere('holidays.reason', 'like', "%{$search_query}%");
            });
        }

        switch ($sort) {
            case 'discord_id':
                $query->orderBy('guild_users.user_id', $direction);
                break;
            case 'discord_name':
                $query->orderBy('users.name', $direction);
                break;
            case 'status':
                $query->orderByRaw("
                    CASE
                        WHEN holidays.deleted_at IS NOT NULL THEN 3
                        WHEN holidays.ended_at IS NOT NULL AND holidays.ended_at < NOW() THEN 2
                        ELSE 1
                    END {$direction}
                ");
                break;
            case 'started_at':
            case 'ended_at':
            case 'reason':
            case 'created_at':
                $query->orderBy('holidays.'.$sort, $direction);
                break;
            default:
                $query->orderBy('holidays.started_at', $direction);
                break;
        }

        return $query->paginate($per_page)->withQueryString();
    }

    public function delete(Holiday $holiday): bool
    {
        $guild = SelectedGuildService::get();
        $holiday_id_array = [$holiday->id];

        return DB::transaction(function () use ($holiday, $holiday_id_array, $guild) {
            $is_deleted = $holiday->delete();

            ActivityLog::make($guild->id, auth()->id(), $holiday->user_id, ActionTypeEnum::CANCEL_HOLIDAY, $holiday_id_array);

            return $is_deleted;
        });
    }

    public function bulkDelete(array $holiday_ids): int
    {
        $guild = SelectedGuildService::get();

        return DB::transaction(function () use ($holiday_ids, $guild) {
            $delete_count = Holiday::whereIn('id', $holiday_ids)->delete();

            ActivityLog::make($guild->id, auth()->id(), null, ActionTypeEnum::CANCEL_HOLIDAY, $holiday_ids);

            return $delete_count;
        });
    }
}
