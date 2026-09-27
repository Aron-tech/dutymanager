<?php

namespace Database\Factories;

use App\Enums\DutyStatusEnum;
use App\Models\Duty;
use App\Models\GuildUser;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Duty>
 */
class DutyFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $started_at = fake()->dateTimeBetween('-1 week', '-2 hours');

        return [
            'guild_user_id' => GuildUser::factory(),
            'guild_id' => fn (array $attributes) => GuildUser::find($attributes['guild_user_id'])->guild_id,
            'user_id' => fn (array $attributes) => GuildUser::find($attributes['guild_user_id'])->user_id,
            'value' => 60,
            'started_at' => $started_at,
            'finished_at' => (clone $started_at)->modify('+60 minutes'),
            'status' => DutyStatusEnum::CURRENT_PERIOD,
        ];
    }

    /**
     * Indicate that the duty is still in progress.
     */
    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'value' => null,
            'started_at' => now()->subMinutes(30),
            'finished_at' => null,
        ]);
    }
}
