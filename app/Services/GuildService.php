<?php

namespace App\Services;

use App\Concerns\ServiceTrait;
use App\Models\Guild;
use App\Models\GuildSettings;
use Exception;
use Illuminate\Support\Facades\DB;

class GuildService
{
    use ServiceTrait;

    private ?Guild $guild = null;

    private ?string $lang = null;

    /**
     * @param Guild|null $guild
     * @param string|null $guild_id
     * @return void
     */
    public function loadModel(?Guild $guild = null, ?string $guild_id = null): void
    {
        $this->guild = $guild ?? Guild::findOrFail($guild_id);
        $this->lang = $this->guild->lang_code;
    }

    /**
     * @return void
     * @throws Exception
     */
    private function ensureModelLoaded(): void
    {
        if (! $this->guild) {
            throw new Exception('A Guild modell nincs betöltve a service-ben.');
        }
    }

    /**
     * @param array $features
     * @param int $next_step
     * @return void
     * @throws Exception
     */
    public function saveEnabledFeatures(array $features, int $next_step): void
    {
        $this->ensureModelLoaded();

        DB::transaction(function () use ($features, $next_step) {
            $guild_settings = GuildSettings::firstOrCreate(
                ['guild_id' => $this->guild->id],
                ['features' => [], 'feature_settings' => [], 'current_step' => 0]
            );

            $guild_settings->update([
                'features' => $features,
                'current_step' => $next_step,
            ]);
        });
    }

    /**
     * @param string $feature_id
     * @param array $settings
     * @param int $next_step
     * @return void
     * @throws Exception
     */
    public function saveFeatureSettings(string $feature_id, array $settings, int $next_step): void
    {
        $this->ensureModelLoaded();

        DB::transaction(function () use ($feature_id, $settings, $next_step) {
            $guild_settings = GuildSettings::firstOrCreate(
                ['guild_id' => $this->guild->id],
                ['features' => [], 'feature_settings' => [], 'current_step' => 0]
            );

            $current_feature_settings = $guild_settings->feature_settings ?? [];
            $current_feature_settings[$feature_id] = $settings;

            $guild_settings->update([
                'feature_settings' => $current_feature_settings,
                'current_step' => $next_step,
            ]);
        });
    }

    /**
     * @return void
     * @throws Exception
     */
    public function finishSetup(): void
    {
        $this->ensureModelLoaded();

        DB::transaction(function () {
            $this->guild->update(['is_installed' => true]);
        });
    }
}
