<?php

namespace App\Services;

use App\Models\Guild;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class DiscordFetchService
{
    /**
     * @return array[]
     */
    public function fetchAndCategorize(string $access_token): array
    {
        $discord_guilds = $this->fetchFromDiscord($access_token);

        if (empty($discord_guilds)) {
            return ['active_guilds' => [], 'setup_guilds' => []];
        }

        $discord_guild_ids = array_column($discord_guilds, 'id');
        $bot_guilds = Guild::whereIn('id', $discord_guild_ids)->get()->keyBy('id');

        $active_guilds = [];
        $setup_guilds = [];

        foreach ($discord_guilds as $discord_guild) {
            if ($bot_guilds->has($discord_guild['id'])) {
                $active_guilds[] = $bot_guilds->get($discord_guild['id']);
            } elseif (! empty($discord_guild['owner'])) {
                $setup_guilds[] = $discord_guild;
            }
        }

        return [
            'active_guilds' => $active_guilds,
            'setup_guilds' => $setup_guilds,
        ];
    }

    /**
     * @param string $access_token
     * @return array
     */
    private function fetchFromDiscord(string $access_token): array
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
