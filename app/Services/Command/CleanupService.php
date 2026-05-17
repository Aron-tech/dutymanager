<?php

declare(strict_types=1);

namespace App\Services\Command;

use App\Enums\FeatureEnum;
use App\Jobs\DeleteDutyJob;
use App\Models\Duty;
use App\Models\Guild;
use App\Models\Holiday;
use App\Models\Punishment;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\DB;

readonly class CleanupService
{
    public function cancelInvalidActiveDuties(CarbonInterface $limit): int
    {
        $duties = Duty::activeDuties()->where('started_at', '<', $limit)->get();
        $duties_count = $duties->count();

        if ($duties_count === 0) {
            return 0;
        }

        $jobs = [];

        foreach ($duties as $duty) {
            $jobs[] = new DeleteDutyJob($duty, null);
        }

        Bus::batch($jobs)->dispatch();

        return $duties_count;
    }

    public function purgeOldDuties(CarbonInterface $limit): int
    {
        return Punishment::onlyTrashed()->where('deleted_at', '<', $limit)->forceDelete();
    }

    public function purgeOldPunishments(CarbonInterface $limit): int
    {
        return DB::transaction(function () use ($limit) {
            return Punishment::withTrashed()
                ->where(function (Builder $query) use ($limit): void {
                    $query->where('expires_at', '<', $limit)
                        ->orWhere('deleted_at', '<', $limit);
                })
                ->forceDelete();
        });
    }

    public function purgeOldHolidays(CarbonInterface $limit): int
    {
        return DB::transaction(function () use ($limit) {
            return Holiday::withTrashed()
                ->where(function (Builder $query) use ($limit): void {
                    $query->where('ended_at', '<', $limit)
                        ->orWhere('deleted_at', '<', $limit);
                })
                ->forceDelete();
        });
    }

    public function purgeExpiredPremiumData(): int
    {
        $guilds = Guild::installed()->with('guildSettings')->whereDoesntHave('activeLicenseKey')->get();

        $processed_guilds = 0;

        foreach ($guilds as $guild) {
            $guild_settings = $guild->guildSettings;

            if (! $guild_settings || empty($guild_settings->user_details_config)) {
                continue;
            }

            $user_details_config = $guild_settings->user_details_config;

            if (count($user_details_config) > 3) {
                $required_configs = [];
                $optional_configs = [];

                foreach ($user_details_config as $config) {
                    if (isset($config['required']) && $config['required'] === true) {
                        $required_configs[] = $config;
                    } else {
                        $optional_configs[] = $config;
                    }
                }

                $new_config = array_slice($required_configs, 0, 3);

                $slots_left = 3 - count($new_config);
                if ($slots_left > 0) {
                    $new_config = array_merge($new_config, array_slice($optional_configs, 0, $slots_left));
                }

                $guild_settings->update(['user_details_config' => $new_config]);

                $allowed_keys = array_column($new_config, 'name');

                $guild->guildUsers()->chunk(100, function ($guild_users) use ($allowed_keys): void {
                    foreach ($guild_users as $user) {
                        if (empty($user->details)) {
                            continue;
                        }

                        $new_details = array_intersect_key($user->details, array_flip($allowed_keys));

                        if ($new_details !== $user->details) {
                            $user->update(['details' => $new_details]);
                        }
                    }
                });

                $should_guild_settings_save = false;
                $duty_settings = $guild_settings->getFeatureSettings(FeatureEnum::DUTY, null);
                $rank_settings = $guild_settings->getFeatureSettings(FeatureEnum::RANK, null);

                if (isset($duty_settings['duty_voice_channel_id'])) {
                    unset($duty_settings['duty_voice_channel_id']);
                    $guild_settings->setFeatureSettings(FeatureEnum::DUTY, null, $duty_settings);
                    $should_guild_settings_save = true;
                }

                if (isset($rank_settings['rank_announcement_channel_id'])) {
                    unset($rank_settings['rank_announcement_channel_id']);
                    $guild_settings->setFeatureSettings(FeatureEnum::RANK, null, $rank_settings);
                    $should_guild_settings_save = true;
                }

                if ($should_guild_settings_save) {
                    $guild_settings->save();
                }

                $processed_guilds++;
            }
        }

        return $processed_guilds;
    }
}
