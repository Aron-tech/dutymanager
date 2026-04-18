<?php

namespace App\Services;

use App\Enums\DutyStatusEnum;
use App\Models\Duty;
use Carbon\CarbonPeriod;

class PageService
{
    /**
     * @param array $data
     * @return array
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

        // Szerver szintű napi átlag optimalizált lekérdezése
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

        $in_guild_days = round($guild_user->created_at->diffInDays(now()));

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
}
