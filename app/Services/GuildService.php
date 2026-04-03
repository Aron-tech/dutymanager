<?php

namespace App\Services;

use App\Concerns\ServiceTrait;
use App\Models\Guild;
use App\Models\GuildSettings;
use Exception;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

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

    private function ensureModelLoaded(): void
    {
        if (! $this->guild) {
            throw new Exception('A Guild modell nincs betöltve a service-ben.');
        }
    }

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

    /**
     * @throws \Throwable
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
     * Speciális tisztító logika a user_details funkcióhoz.
     */
    public function saveUserDetailsConfig(array $settings, string $next_step): void
    {
        $cleaned_settings = [
            'require_real_name' => (bool) Arr::get($settings, 'require_real_name', false),
            'name_format' => trim(Arr::get($settings, 'name_format', '{first} {last}')),
            'log_channel_id' => trim(Arr::get($settings, 'log_channel_id', '')),
        ];

        $this->saveFeatureSettings('user_details', $cleaned_settings, $next_step);
    }

    public function finishSetup(): void
    {
        $this->ensureModelLoaded();

        DB::transaction(function () {
            // is_installed helyett a migration-ben lévő is_complete mezőt frissítjük
            $guild_settings = GuildSettings::where('guild_id', $this->guild->id)->first();
            if ($guild_settings) {
                $guild_settings->update(['is_complete' => true]);
            }
        });
    }
}
