<?php

namespace Database\Factories;

use App\Models\Guild;
use App\Models\GuildUser;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<GuildUser>
 */
class GuildUserFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'guild_id' => Guild::factory(),
            'ic_name' => fake()->name(),
            'details' => [],
            'is_request' => false,
            'accepted_at' => now(),
            'cached_roles' => [],
            'rank_changed_at' => now(),
            'data' => [],
        ];
    }

    /**
     * Indicate that the user only requested to join and is not accepted yet.
     */
    public function pending(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_request' => true,
            'accepted_at' => null,
        ]);
    }
}
