<?php

namespace App\Services;

use App\Concerns\ServiceTrait;
use App\DTO\ServiceResponseDTO;
use App\Enums\ActionTypeEnum;
use App\Enums\FeatureEnum;
use App\Models\ActivityLog;
use App\Models\Guild;
use App\Models\Holiday;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class HolidayService
{
    use ServiceTrait;

    public function getPaginatedHolidays(Guild $guild, array $filters = []): LengthAwarePaginator
    {
        $search_query = $filters['search'] ?? null;
        $per_page = $filters['per_page'] ?? 20;
        $sort = $filters['sort'] ?? 'started_at';
        $direction = strtolower($filters['direction'] ?? 'desc') === 'asc' ? 'asc' : 'desc';
        $date_from = $filters['date_from'] ?? null;
        $date_to = $filters['date_to'] ?? null;
        $status_filters = $filters['statuses'] ?? [];

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

        if ($date_from) {
            $query->whereDate('holidays.started_at', '>=', $date_from);
        }
        if ($date_to) {
            $query->whereDate('holidays.started_at', '<=', $date_to);
        }

        if (! empty($status_filters) && ! in_array('all', $status_filters)) {
            $query->where(function ($q) use ($status_filters) {
                if (in_array('revoked', $status_filters)) {
                    $q->orWhereNotNull('holidays.deleted_at');
                }
                if (in_array('expired', $status_filters)) {
                    $q->orWhere(function ($sub_query) {
                        $sub_query->whereNull('holidays.deleted_at')
                            ->whereNotNull('holidays.ended_at')
                            ->where('holidays.ended_at', '<', now());
                    });
                }
                if (in_array('active', $status_filters)) {
                    $q->orWhere(function ($sub_query) {
                        $sub_query->whereNull('holidays.deleted_at')
                            ->where(function ($date_sub_query) {
                                $date_sub_query->whereNull('holidays.ended_at')
                                    ->orWhere('holidays.ended_at', '>=', now());
                            });
                    });
                }
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

    public function store($data): ServiceResponseDTO
    {
        $guild = SelectedGuildService::get();
        $guild_user = $guild->acceptedGuildUsers()->where('user_id', $data['user_id'])->first();

        if (! $guild_user) {
            return $this->makeResponse(false, null, 'guild_user.error_not_found_user');
        }

        if (! $guild->guildSettings->isEnabledFeature(FeatureEnum::HOLIDAY)) {
            return $this->makeResponse(false, null, __('app.feature_not_enabled'));
        }

        $holiday = DB::transaction(function () use ($guild_user, $data) {

            $holiday = Holiday::make($guild_user, $data['reason'], $data['duration_in_days'], $data['holiday_start_delay_days'] ?? 0);

            if (! empty($holiday)) {
                ActivityLog::make($guild_user->guild_id, auth()->id(), $guild_user->user_id, ActionTypeEnum::GET_HOLIDAY, $holiday->toArray());
            }

            return $holiday;
        });

        if ($holiday === null) {
            return $this->makeResponse(false, null, 'holiday.guild_user_already_has_active_holiday');
        } else {
            return $this->makeResponse(true, $holiday, 'holiday.success_get_holiday', (int) ['days' => $data['duration_in_days']]);
        }
    }

    public function delete(Holiday $holiday, ?Guild $guild = null, ?string $causer_id = null): bool
    {
        $guild ??= SelectedGuildService::get();
        $causer_id ??= auth()->id();
        $holiday_id_array = [$holiday->id];
        $holiday_role_id = $guild->guildSettings->getFeatureSettings(FeatureEnum::HOLIDAY, 'holiday_role_id', null);
        $is_active = $holiday->ended_at > now();

        $is_deleted = DB::transaction(function () use ($holiday, $holiday_id_array, $guild, $causer_id) {
            $is_deleted = $holiday->delete();

            ActivityLog::make($guild->id, $causer_id, $holiday->user_id, ActionTypeEnum::CANCEL_HOLIDAY, $holiday_id_array);

            return $is_deleted;
        });

        if ($is_deleted && $is_active && $holiday_role_id) {
            DiscordFetchService::removeRoleFromMember($guild->id, $holiday->user_id, $holiday_role_id);
        }

        return $is_deleted;
    }

    /**
     * @throws \Throwable
     */
    public function bulkDelete(array $holiday_ids): int
    {
        $guild = SelectedGuildService::get();
        $holidays = Holiday::whereIn('id', $holiday_ids)->with('guildUser')->get();
        $holiday_role_id = $guild->guildSettings->getFeatureSettings(FeatureEnum::HOLIDAY, 'holiday_role_id', null);

        return DB::transaction(function () use ($holidays, $guild, $holiday_role_id) {

            $delete_count = 0;

            foreach ($holidays as $holiday) {
                $archive_holiday = clone $holiday;
                if ($holiday->delete()) {
                    if (! empty($holiday_role_id)) {
                        DiscordFetchService::removeRoleFromMember($guild->id, $holiday->user_id, $holiday_role_id);
                    }
                    ActivityLog::make($guild->id, auth()->id(), $holiday->user_id, ActionTypeEnum::CANCEL_HOLIDAY, $archive_holiday->toArray());
                    $delete_count++;
                }
            }

            return $delete_count;
        });
    }
}
