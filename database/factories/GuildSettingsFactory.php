<?php

namespace Database\Factories;

use App\Enums\FeatureEnum;
use App\Models\Guild;
use App\Models\GuildSettings;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<GuildSettings>
 */
class GuildSettingsFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'guild_id' => Guild::factory(),
            'features' => FeatureEnum::getOptions(),
            'feature_settings' => [],
            'user_details_config' => [],
            'current_view' => 'finish',
            'is_complete' => true,
        ];
    }
}
