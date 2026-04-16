<?php

namespace App\Services;

use App\Concerns\ServiceTrait;
use App\Models\Guild;
use App\Models\GuildSettings;
use Exception;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

class GuildService
{
    use ServiceTrait;

    private ?Guild $guild = null;

    private ?string $lang = null;

    public function loadModel(?Guild $guild = null, ?string $guild_id = null): void
    {
        $this->guild = $guild ?? Guild::findOrFail($guild_id);
        $this->lang = $this->guild->lang_code;
    }

    /**
     * @throws Exception
     */
    private function ensureModelLoaded(): void
    {
        if (! $this->guild) {
            throw new Exception('A Guild modell nincs betöltve a service-ben.');
        }
    }

    /**
     * @throws Throwable
     */
    public function saveEnabledFeatures(array $features, string $next_step): void
    {
        $this->ensureModelLoaded();

        DB::transaction(function () use ($features, $next_step) {
            $guild_settings = GuildSettings::firstOrCreate(
                ['guild_id' => $this->guild->id],
                ['features' => [], 'feature_settings' => [], 'current_view' => 'general_settings']
            );

            $guild_settings->update([
                'features' => $features,
                'current_view' => $next_step,
            ]);
        });
    }

    public function saveFeatures(array $data): bool
    {
        try {
            return \DB::transaction(function () use ($data) {
                $guild_settings = $this->guild->guildSettings()->firstOrCreate(
                    ['guild_id' => $this->guild->id],
                    ['current_view' => 'general_settings', 'is_complete' => false]
                );

                $guild_settings->update([
                    'features' => $data['features'] ?? [],
                    'current_view' => $data['next_view'],
                ]);

                return true;
            });
        } catch (Throwable $e) {
            Log::error('Hiba a guild setup mentésekor: '.$e->getMessage());

            return false;
        }
    }

    /**
     * @throws Throwable
     */
    public function saveFeatureSettings(string $feature_id, array $settings, string $next_step): void
    {
        $this->ensureModelLoaded();

        DB::transaction(function () use ($feature_id, $settings, $next_step) {
            $guild_settings = GuildSettings::firstOrCreate(
                ['guild_id' => $this->guild->id],
                ['features' => [], 'feature_settings' => [], 'current_view' => 'general_settings']
            );

            $current_feature_settings = $guild_settings->feature_settings ?? [];
            $current_feature_settings[$feature_id] = $settings;

            $guild_settings->update([
                'feature_settings' => $current_feature_settings,
                'current_view' => $next_step,
            ]);
        });
    }

    /**
     * @throws Throwable
     */
    /**
     * @throws Throwable
     */
    public function saveUserDetailsConfig(array $settings, string $next_step): void
    {
        $this->ensureModelLoaded();

        DB::transaction(function () use ($settings, $next_step) {
            $guild_settings = GuildSettings::firstOrCreate(
                ['guild_id' => $this->guild->id]
            );

            $feature_settings = $guild_settings->feature_settings ?? [];
            $feature_settings['user_details'] = [
                'log_channel_id' => trim(Arr::get($settings, 'log_channel_id', '')),
            ];

            $guild_settings->update([
                'feature_settings' => $feature_settings,
                'user_details_config' => Arr::get($settings, 'config', []),
                'current_view' => $next_step,
            ]);
        });
    }

    /**
     * @throws Throwable
     */
    public function finishSetup(): void
    {
        $this->ensureModelLoaded();

        DB::transaction(function () {
            $guild_settings = GuildSettings::where('guild_id', $this->guild->id)->first();
            if ($guild_settings) {
                $guild_settings->update(['is_complete' => true]);
            }
        });
    }


}
