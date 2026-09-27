<?php

namespace Database\Factories;

use App\Models\Guild;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Guild>
 */
class GuildFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'id' => (string) fake()->unique()->numberBetween(100000000000000000, 999999999999999999),
            'name' => fake()->company(),
            'icon' => null,
            'owner_id' => User::factory(),
            'lang_code' => 'hu',
            'is_installed' => true,
            'data' => [],
        ];
    }

    /**
     * Indicate that the bot has not been initialized on the guild yet.
     */
    public function notInstalled(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_installed' => false,
        ]);
    }
}
