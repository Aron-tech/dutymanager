<?php

namespace App\Services;

use App\Models\Guild;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class DiscordFetchService
{
    /**
     * @return array{my_servers: array, pending_addition: array}
     */
    public function getCategorizedGuilds(string $token, int $user_id): array
    {
        $cache_key = "discord_guilds_user_{$user_id}";

        $discord_guilds_raw = Cache::remember($cache_key, now()->addMinutes(5), function () use ($token) {
            $response = Http::withToken($token)
                ->timeout(5)
                ->get('https://discord.com/api/v10/users/@me/guilds');

            return $response->successful() ? $response->json() : [];
        });

        $discord_guilds = collect($discord_guilds_raw);

        if ($discord_guilds->isEmpty()) {
            return ['my_servers' => [], 'pending_addition' => []];
        }

        $discord_guild_ids = $discord_guilds->pluck('id')->toArray();

        $db_guilds = Guild::whereIn('id', $discord_guild_ids)->get()->keyBy('id');

        $my_servers = [];
        $pending_addition = [];

        foreach ($discord_guilds as $guild_data) {
            $discord_id = (string) $guild_data['id'];
            $is_owner = $guild_data['owner'] ?? false;
            $is_admin = (($guild_data['permissions'] ?? 0) & 8) === 8;

            if ($db_guilds->has($discord_id)) {
                $my_servers[] = [
                    'discord_id' => $discord_id,
                    'name' => $guild_data['name'],
                    'icon' => $guild_data['icon'] ?? null,
                    'is_installed' => (bool) $db_guilds->get($discord_id)->is_installed,
                ];
            } elseif ($is_owner || $is_admin) {
                $pending_addition[] = [
                    'discord_id' => $discord_id,
                    'name' => $guild_data['name'],
                    'icon' => $guild_data['icon'] ?? null,
                ];
            }
        }

        return [
            'my_servers' => $my_servers,
            'pending_addition' => $pending_addition,
        ];
    }

    /**
     * @param string $access_token
     * @return array
     */
    private function fetchGuilds(string $access_token): array
    {
        $cache_key = 'discord_user_guilds_'.md5($access_token);

        return Cache::remember($cache_key, now()->addMinutes(5), function () use ($access_token) {
            $response = Http::withToken($access_token)
                ->get('https://discord.com/api/users/@me/guilds');

            if ($response->failed()) {
                return [];
            }

            return $response->json();
        });
    }
}
