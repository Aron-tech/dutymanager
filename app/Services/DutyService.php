<?php

namespace App\Services;

use App\Actions\DeleteActiveDutyAction;
use App\Concerns\ServiceTrait;
use App\Enums\ActionTypeEnum;
use App\Enums\DutyStatusEnum;
use App\Enums\FeatureEnum;
use App\Models\ActivityLog;
use App\Models\Duty;
use App\Models\Guild;
use App\Models\GuildSettings;
use App\Models\GuildUser;
use Illuminate\Database\Query\Builder;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Throwable;

class DutyService
{
    use ServiceTrait;

    private ?Duty $duty = null;

    public function loadModel(?Duty $duty, ?int $duty_id): void
    {
        $this->duty = $duty ?? Duty::findOrFail($duty_id);
    }

    public function getPaginatedDuties(Guild $guild, array $filters = []): LengthAwarePaginator
    {
        $search_query = $filters['search'] ?? null;
        $per_page = $filters['per_page'] ?? 20;
        $sort = $filters['sort'] ?? 'started_at';
        $direction = strtolower($filters['direction'] ?? 'desc') === 'asc' ? 'asc' : 'desc';
        $status_filter = $filters['status'] ?? 'all';

        $query = Duty::query()
            ->whereHas('guildUser', function ($q) use ($guild) {
                $q->where('guild_id', $guild->id);
            })
            ->with(['guildUser.user:id,name']);

        if ($status_filter !== 'all') {
            $query->where('status', $status_filter);
        }

        if ($search_query) {
            $query->where(function ($q) use ($search_query) {
                $q->where('value', 'like', "%{$search_query}%")
                    ->orWhereHas('guildUser', function ($gq) use ($search_query) {
                        $gq->where('user_id', 'like', "%{$search_query}%")
                            ->orWhere('ic_name', 'like', "%{$search_query}%")
                            ->orWhereHas('user', function ($uq) use ($search_query) {
                                $uq->where('name', 'like', "%{$search_query}%");
                            });
                    });
            });
        }

        switch ($sort) {
            case 'discord_id':
                $query->join('guild_users', 'duties.guild_user_id', '=', 'guild_users.id')
                    ->select('duties.*')
                    ->orderBy('guild_users.user_id', $direction);
                break;
            case 'discord_name':
                $query->join('guild_users', 'duties.guild_user_id', '=', 'guild_users.id')
                    ->join('users', 'guild_users.user_id', '=', 'users.id')
                    ->select('duties.*')
                    ->orderBy('users.name', $direction);
                break;
            default:
                $query->orderBy($sort, $direction);
                break;
        }

        return $query->paginate($per_page)->withQueryString();
    }

    /**
     * @param Guild $guild
     * @param array $filters
     * @return LengthAwarePaginator
     */
    public function getPaginatedActiveDuties(Guild $guild, array $filters): LengthAwarePaginator
    {
        $search = $filters['search'] ?? null;
        $sort = $filters['sort'] ?? 'started_at';
        $direction = strtolower($filters['direction'] ?? 'desc') === 'asc' ? 'asc' : 'desc';
        $per_page = (int) ($filters['per_page'] ?? 20);

        $query = Duty::query()
            ->select('duties.*')
            ->join('guild_users', 'duties.guild_user_id', '=', 'guild_users.id')
            ->join('users', 'guild_users.user_id', '=', 'users.id')
            ->where('guild_users.guild_id', $guild->id)
            ->whereNotNull('guild_users.accepted_at')
            ->activeDuties()
            ->with(['guildUser.user:id,name']);

        if ($search !== null && $search !== '') {
            $query->where(function (Builder $q) use ($search): void {
                $q->where('users.name', 'like', "%{$search}%")
                    ->orWhere('guild_users.user_id', 'like', "%{$search}%")
                    ->orWhere('guild_users.ic_name', 'like', "%{$search}%");
            });
        }

        match ($sort) {
            'discord_id' => $query->orderBy('guild_users.user_id', $direction),
            'discord_name' => $query->orderBy('users.name', $direction),
            'ic_name' => $query->orderBy('guild_users.ic_name', $direction),
            default => $query->orderBy('duties.started_at', $direction),
        };

        return $query->paginate($per_page)->withQueryString();
    }

    /**
     * @param Guild $guild
     * @return array
     */
    public function getHourlyChartData(Guild $guild): array
    {
        $chart_data_array = [];
        $now = now();

        for ($i = 23; $i >= 0; $i--) {
            $hour_string = $now->copy()->subHours($i)->format('H:00');
            $chart_data_array[$hour_string] = [
                'date' => $hour_string,
                'count' => 0,
            ];
        }

        $db_data = DB::table('duties')
            ->join('guild_users', 'duties.guild_user_id', '=', 'guild_users.id')
            ->where('guild_users.guild_id', $guild->id)
            ->where('duties.started_at', '>=', $now->copy()->subHours(24))
            ->whereNotNull('guild_users.accepted_at') // Grafikon adatoknál is csak a jóváhagyott tagok
            ->selectRaw('DATE_FORMAT(duties.started_at, "%H:00") as date, COUNT(*) as count')
            ->groupBy('date')
            ->get();

        foreach ($db_data as $row) {
            if (isset($chart_data_array[$row->date])) {
                $chart_data_array[$row->date]['count'] = (int) $row->count;
            }
        }

        return array_values($chart_data_array);
    }

    public function storeDuty(array $data): Duty
    {
        return DB::transaction(function () use ($data) {
            $guild_user = GuildUser::where('id', $data['guild_user_id'])->accepted()->firstOrFail();
            $duty = $guild_user->duties()->create([
                ...$data,
                'user_id' => $guild_user->user_id,
                'guild_id' => $guild_user->guild_id,
                'started_at' => time(),
                'finished_at' => time(),
            ]);

            ActivityLog::make($guild_user->guild_id, auth()->id(), $guild_user->user_id, ActionTypeEnum::ADD_DUTY_TO_GUILD_USER, $duty->toArray());

            return $duty;
        });
    }

    public function updateDutiesStatus(array $duty_ids, DutyStatusEnum $status): void
    {
        DB::transaction(function () use ($duty_ids, $status) {
            Duty::whereIn('id', $duty_ids)->update(['status' => $status]);
        });
    }

    public function deleteDuty(Duty $duty): void
    {
        DB::transaction(function () use ($duty) {
            if (! DeleteActiveDutyAction::run($duty, auth()->id())) {
                ActivityLog::make($duty->guild_id, auth()->id(), $duty->user_id, ActionTypeEnum::DELETE_DUTY_FROM_GUILD_USER, $duty->toArray());
            }
            $duty->delete();
        });
    }

    /**
     * @throws Throwable
     */
    public function deleteDuties(array $duty_ids, DutyStatusEnum $status = DutyStatusEnum::ALL_PERIOD): void
    {
        DB::transaction(function () use ($duty_ids, $status) {

            $deleted = [];
            $guild = SelectedGuildService::get();
            $auth_id = auth()->id();

            Duty::whereIn('id', $duty_ids)
                ->where('status', '<=', $status)
                ->chunkById(100, function ($duties) use ($auth_id, &$deleted) {

                    foreach ($duties as $duty) {
                        if (! DeleteActiveDutyAction::run($duty, $auth_id)) {
                            $deleted[] = $duty->replicate()->toArray();
                        }
                        $duty->delete();
                    }
                });

            ActivityLog::make($guild->id, auth()->id(), null, ActionTypeEnum::DELETE_DUTY_FROM_GUILD_USER, $deleted);
        });
    }
}
