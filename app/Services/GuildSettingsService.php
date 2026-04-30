<?php

namespace App\Services;

use App\Models\GuildSettings;
use Illuminate\Support\Facades\DB;

readonly class GuildSettingsService
{
    /**
     * @param GuildSettings $guild_settings
     * @param array $enabled_features
     * @param array $settings
     * @return void
     * @throws \Throwable
     */
    public function updateSettings(GuildSettings $guild_settings, array $enabled_features, array $settings): void
    {
        DB::transaction(function () use ($guild_settings, $enabled_features, $settings): void {
            $feature_settings = $guild_settings->feature_settings ?? [];

            $guild_settings->features = $enabled_features;

            if (isset($settings['user_details'])) {
                $guild_settings->user_details_config = $settings['user_details'];
            }

            $valid_feature_keys = array_merge(['general'], $enabled_features);

            foreach ($valid_feature_keys as $feature_key) {
                if (isset($settings[$feature_key])) {
                    $feature_settings[$feature_key] = $settings[$feature_key];
                }
            }

            foreach (array_keys($feature_settings) as $existing_key) {
                if (! in_array($existing_key, $valid_feature_keys, true)) {
                    unset($feature_settings[$existing_key]);
                }
            }

            $guild_settings->feature_settings = $feature_settings;

            $guild_settings->save();
        });
    }
}
