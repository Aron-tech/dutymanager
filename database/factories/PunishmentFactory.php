<?php

namespace Database\Factories;

use App\Enums\PunishmentTypeEnum;
use App\Models\GuildUser;
use App\Models\Punishment;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Punishment>
 */
class PunishmentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'guild_user_id' => GuildUser::factory(),
            'guild_id' => fn (array $attributes) => GuildUser::find($attributes['guild_user_id'])->guild_id,
            'user_id' => fn (array $attributes) => GuildUser::find($attributes['guild_user_id'])->user_id,
            'type' => PunishmentTypeEnum::WARNING,
            'level' => 1,
            'reason' => fake()->sentence(),
            'created_by' => fn (array $attributes) => GuildUser::find($attributes['guild_user_id'])->user_id,
            'expires_at' => now()->addWeek(),
            'is_expired' => false,
        ];
    }
}
