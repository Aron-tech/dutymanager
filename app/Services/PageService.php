<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\DutyStatusEnum;
use App\Models\Duty;
use App\Models\GuildUser;
use App\Models\Punishment;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

final class PageService
{
    /**
     * @param array<string, mixed> $data
     * @return array<string, mixed>
     */
    public function getDashboardData(array $data = []): array
    {
        $stats = $data['stats'] ?? 7;

        $guild = SelectedGuildService::get();

        $guild_user = auth()->user()->guildUser($guild->id)
            ->withExists(['duties as has_active_duty' => function ($query) {
                $query->where('status', '<=', DutyStatusEnum::CURRENT_PERIOD)
                    ->whereNull('finished_at');
            }])
            ->withSum(['duties as total_duty_time' => function ($query) {
                $query->where('status', '<=', DutyStatusEnum::ALL_PERIOD);
            }], 'value')
            ->withSum(['duties as current_total_duty_time' => function ($query) {
                $query->where('status', '<=', DutyStatusEnum::CURRENT_PERIOD);
            }], 'value')
            ->firstOrFail();

        $duties_raw = $guild_user->duties()
            ->where('started_at', '>=', now()->subDays($stats)->startOfDay())
            ->selectRaw('DATE(started_at) as date, status, SUM(value) as total_value')
            ->groupBy('date', 'status')
            ->get()
            ->groupBy('date');

        $guild_avg_raw = Duty::query()
            ->whereIn('guild_user_id', function ($query) use ($guild) {
                $query->select('id')->from('guild_users')->where('guild_id', $guild->id);
            })
            ->where('started_at', '>=', now()->subDays($stats)->startOfDay())
            ->selectRaw('DATE(started_at) as date, (SUM(value) / COUNT(DISTINCT guild_user_id)) as avg_value')
            ->groupBy('date')
            ->pluck('avg_value', 'date');

        $period = CarbonPeriod::create(now()->subDays($stats), now());
        $duty_chart_data = [];

        foreach ($period as $date) {
            $date_string = $date->format('Y-m-d');

            $day_data = $duties_raw->get($date_string) ?? collect();

            $current_value = $day_data->filter(fn ($item) => $item->status->value <= DutyStatusEnum::CURRENT_PERIOD->value)
                ->sum('total_value');

            $all_value = $day_data->filter(fn ($item) => $item->status->value <= DutyStatusEnum::ALL_PERIOD->value)
                ->sum('total_value');

            $guild_avg = $guild_avg_raw->get($date_string) ?? 0;

            $duty_chart_data[] = [
                'date' => $date_string,
                'current_value' => (int) $current_value,
                'all_value' => (int) $all_value,
                'guild_avg' => (int) $guild_avg,
            ];
        }

        $active_duties_count = Duty::getActiveDutiesCount();
        $in_guild_days = (int) round($guild_user->created_at->diffInDays(now()));

        return [
            'active_duties_count' => $active_duties_count,
            'has_active_duty' => $guild_user->has_active_duty,
            'current_total_duty_time' => (int) $guild_user->current_total_duty_time,
            'total_duty_time' => (int) $guild_user->total_duty_time,
            'in_guild_days' => $in_guild_days,
            'duty_chart_data' => $duty_chart_data,
            'stats_days' => $stats,
            'guild_user_id' => $guild_user->id,
        ];
    }

    /**
     * @param string $guild_id
     * @param int $days
     * @return array<string, mixed>
     */
    public function getStatistics(string $guild_id, int $days): array
    {
        $start_date = Carbon::now()->subDays($days)->startOfDay();

        return [
            'duty_distribution' => $this->getDutyDistribution($guild_id, $start_date),
            'punishment_distribution' => $this->getPunishmentDistribution($guild_id, $start_date),
            'top_users' => $this->getTopActiveUsers($guild_id, $start_date),
            'daily_stats' => $this->getDailyStats($guild_id, $days),
            'total_period_time' => $this->getTotalPeriodTime($guild_id, $start_date),
        ];
    }

    /**
     * @param string $guild_id
     * @param Carbon $start_date
     * @return array<string, int>
     */
    private function getDutyDistribution(string $guild_id, Carbon $start_date): array
    {
        $base_query = fn () => GuildUser::query()->where('guild_id', $guild_id)->accepted();

        $active_count = $base_query()
            ->whereHas('duties', function ($query) use ($start_date) {
                $query->where('started_at', '>=', $start_date)->whereNotNull('finished_at');
            })
            ->count();

        $on_holiday_count = $base_query()
            ->whereDoesntHave('duties', function ($query) use ($start_date) {
                $query->where('started_at', '>=', $start_date)->whereNotNull('finished_at');
            })
            ->whereHas('holidays', function ($query) use ($start_date) {
                $query->where('started_at', '<=', Carbon::now())->where('ended_at', '>=', $start_date);
            })
            ->count();

        $total_users = $base_query()->count();
        $inactive_count = $total_users - $active_count - $on_holiday_count;

        return [
            'total' => $total_users,
            'active' => $active_count,
            'inactive' => $inactive_count,
            'on_holiday' => $on_holiday_count,
        ];
    }

    /**
     * @param string $guild_id
     * @param Carbon $start_date
     * @return Collection
     */
    private function getPunishmentDistribution(string $guild_id, Carbon $start_date): Collection
    {
        return Punishment::query()
            ->where('guild_id', $guild_id)
            ->where('created_at', '>=', $start_date)
            ->select('type', DB::raw('count(*) as total'))
            ->groupBy('type')
            ->pluck('total', 'type');
    }

    /**
     * @param string $guild_id
     * @param Carbon $start_date
     * @return Collection
     */
    private function getTopActiveUsers(string $guild_id, Carbon $start_date): Collection
    {
        return GuildUser::query()
            ->where('guild_id', $guild_id)
            ->accepted()
            ->with('user:id,name,avatar_url')
            ->withSum([
                'duties' => function ($query) use ($start_date) {
                    $query->where('started_at', '>=', $start_date)
                        ->whereNotNull('finished_at');
                },
            ], 'value')
            ->orderByDesc('duties_sum_value')
            ->limit(10)
            ->get()
            ->map(function ($guild_user) {
                return [
                    'id' => $guild_user->id,
                    'name' => $guild_user->user->name ?? $guild_user->ic_name,
                    'avatar_url' => $guild_user->user->avatar_url ?? null,
                    'total_minutes' => (int) $guild_user->duties_sum_value,
                ];
            });
    }

    /**
     * @param string $guild_id
     * @param int $days
     * @return array<int, array<string, mixed>>
     */
    private function getDailyStats(string $guild_id, int $days): array
    {
        $start_date = now()->subDays($days)->startOfDay();
        $period = CarbonPeriod::create($start_date, now());
        $daily_stats = [];

        $duties_raw = Duty::query()
            ->whereIn('guild_user_id', function ($query) use ($guild_id) {
                $query->select('id')->from('guild_users')->where('guild_id', $guild_id);
            })
            ->where('started_at', '>=', $start_date)
            ->where('status', '<=', DutyStatusEnum::CURRENT_PERIOD->value)
            ->selectRaw('DATE(started_at) as date, COUNT(DISTINCT guild_user_id) as active_users, SUM(value) as total_time')
            ->groupBy('date')
            ->get()
            ->keyBy('date');

        foreach ($period as $date) {
            $date_string = $date->format('Y-m-d');
            $stat = $duties_raw->get($date_string);

            $active_users = $stat ? (int) $stat->active_users : 0;
            $total_time = $stat ? (int) $stat->total_time : 0;
            $avg_time = $active_users > 0 ? (int) round($total_time / $active_users) : 0;

            $daily_stats[] = [
                'date' => $date_string,
                'active_users' => $active_users,
                'avg_time' => $avg_time,
            ];
        }

        return $daily_stats;
    }

    /**
     * @param string $guild_id
     * @param Carbon $start_date
     * @return int
     */
    private function getTotalPeriodTime(string $guild_id, Carbon $start_date): int
    {
        return (int) Duty::query()
            ->whereIn('guild_user_id', function ($query) use ($guild_id) {
                $query->select('id')->from('guild_users')->where('guild_id', $guild_id);
            })
            ->where('started_at', '>=', $start_date)
            ->where('status', '<=', DutyStatusEnum::CURRENT_PERIOD->value)
            ->sum('value');
    }
}
