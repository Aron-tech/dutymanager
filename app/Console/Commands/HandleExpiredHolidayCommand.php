<?php

namespace App\Console\Commands;

use App\Enums\FeatureEnum;
use App\Jobs\RemoveDiscordRoleJob;
use App\Models\GuildSettings;
use App\Models\Holiday;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Bus;

#[Signature('app:handle-expired-holiday-command {--loud : Output progress information}')]
#[Description('Command description')]
class HandleExpiredHolidayCommand extends Command
{
    public function handle(): void
    {
        $is_loud = $this->option('loud');

        if ($is_loud) {
            $this->info('Handling expired holidays started.');
        }

        $holidays = Holiday::with('guildUser')
            ->where('ended_at', '<=', now())
            ->where('is_expired', false)
            ->whereHas('guildUser', fn ($q) => $q->accepted())
            ->whereHas('guild', fn ($q) => $q->installed())
            ->get();

        if ($holidays->isEmpty()) {
            if ($is_loud) {
                $this->info('No expired holidays found.');
            }

            return;
        }

        $affected_guild_ids = $holidays->pluck('guild_id')->unique();
        $guild_settings_collection = GuildSettings::whereIn('guild_id', $affected_guild_ids)->get()->keyBy('guild_id');

        $jobs = [];
        $processed_holiday_ids = [];

        foreach ($holidays as $holiday) {
            $guild_settings = $guild_settings_collection->get($holiday->guild_id);

            if ($guild_settings && $guild_settings->isEnabledFeature(FeatureEnum::HOLIDAY)) {
                $holiday_role = $guild_settings->getFeatureSettings(FeatureEnum::HOLIDAY, 'holiday_role_id');

                if (! empty($holiday_role)) {
                    $jobs[] = new RemoveDiscordRoleJob($holiday->guild_id, $holiday->user_id, [$holiday_role]);
                }
            }

            $processed_holiday_ids[] = $holiday->id;
        }

        if (! empty($processed_holiday_ids)) {
            Holiday::whereIn('id', $processed_holiday_ids)->update(['is_expired' => true]);
        }

        if (! empty($jobs)) {
            Bus::batch($jobs)->dispatch();
        }

        if ($is_loud) {
            $this->info('Handling expired holidays finished.');
        }
    }
}
