<?php

namespace App\Services;

use App\Enums\GlobalRoleEnum;
use App\Models\Guild;
use App\Models\GuildSettings;
use App\Models\GuildUser;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;

class DiscordFetchService
{
    private static function executeDiscordApiRequest(string $method, string $url, array $headers, array $payload = []): ?array
    {
        $max_retries = 3;
        $attempt = 0;

        while ($attempt < $max_retries) {
            try {
                $request = Http::withHeaders($headers)->timeout(10);

                $response = strtolower($method) === 'get'
                    ? $request->get($url, $payload)
                    : $request->post($url, $payload);

                if ($response->successful()) {
                    return $response->json();
                }

                if ($response->status() === 429) {
                    $retry_after = $response->json('retry_after') ?? $response->header('Retry-After') ?? 1;
                    sleep((int) ceil((float) $retry_after));
                    $attempt++;

                    continue;
                }

                Log::error("Discord API hiba ({$url}): ".$response->body());

                return null;
            } catch (\Exception $e) {
                Log::error('Discord API kapcsolódási hiba: '.$e->getMessage());

                return null;
            }
        }

        return null;
    }

    private static function cacheValidResponse(string $key, int $minutes, \Closure $callback): mixed
    {
        $cached_data = Cache::get($key);

        if ($cached_data !== null) {
            return $cached_data;
        }

        $data = $callback();

        if ($data !== null) {
            Cache::put($key, $data, now()->addMinutes($minutes));
        }

        return $data;
    }

    private static function callBotApi(string $method, string $endpoint, array $payload = []): ?array
    {
        $bot_api_url = 'https://discord.com/api/v10';
        $bot_api_key = config('services.discord.token');

        $url = rtrim($bot_api_url, '/').'/'.ltrim($endpoint, '/');

        $headers = [
            'Authorization' => "Bot {$bot_api_key}",
            'Accept' => 'application/json',
        ];

        return self::executeDiscordApiRequest($method, $url, $headers, $payload);
    }

    private static function fetchRawGuilds(string $token, string $user_id): array
    {
        $data = self::cacheValidResponse("discord_guilds_user_{$user_id}", 5, function () use ($token) {
            $url = 'https://discord.com/api/v10/users/@me/guilds';
            $headers = [
                'Authorization' => "Bearer {$token}",
                'Accept' => 'application/json',
            ];

            return self::executeDiscordApiRequest('GET', $url, $headers);
        });

        return $data ?? [];
    }

    public static function getUserProfile(string $user_token): ?array
    {
        return self::cacheValidResponse('discord_user_profile_'.md5($user_token), 15, function () use ($user_token) {
            $url = 'https://discord.com/api/v10/users/@me';
            $headers = [
                'Authorization' => "Bearer {$user_token}",
                'Accept' => 'application/json',
            ];

            return self::executeDiscordApiRequest('GET', $url, $headers);
        });
    }

    /**
     * @return array{my_servers: array, pending_addition: array}
     */
    public static function getCategorizedGuilds(string $token, User $user): array
    {
        $discord_guilds = collect(self::fetchRawGuilds($token, $user->id));

        if ($discord_guilds->isEmpty()) {
            return ['my_servers' => [], 'pending_addition' => []];
        }

        $discord_guild_ids = $discord_guilds->pluck('id')->toArray();
        $db_guilds = Guild::whereIn('id', $discord_guild_ids)->get()->keyBy('id');

        $my_servers = [];
        $pending_addition = [];

        $has_global_role = in_array($user->global_role, [
            GlobalRoleEnum::ADMIN->value,
            GlobalRoleEnum::DEVELOPER->value,
        ]);

        foreach ($discord_guilds as $guild_data) {
            $discord_id = (string) $guild_data['id'];
            $is_owner = $guild_data['owner'] ?? false;
            $permissions = $guild_data['permissions'] ?? 0;
            $has_manage_or_admin = ($permissions & 0x20) === 0x20 || ($permissions & 0x8) === 0x8;

            if ($db_guilds->has($discord_id)) {
                $my_servers[] = [
                    'discord_id' => $discord_id,
                    'name' => $guild_data['name'],
                    'icon' => $guild_data['icon'] ?? null,
                    'is_installed' => (bool) $db_guilds->get($discord_id)->is_installed,
                ];
            } elseif ($is_owner || $has_manage_or_admin || $has_global_role) {
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

    public static function isDevGuildMember(string $token, string $user_id): bool
    {
        $dev_guild_id = config('services.discord.dev_guild_id', '1394218179554967583');
        $discord_guilds = collect(self::fetchRawGuilds($token, $user_id));

        return $discord_guilds->contains('id', $dev_guild_id);
    }

    public static function getGuild(string $guild_id): ?array
    {
        return self::cacheValidResponse("discord_guild_{$guild_id}", 15, function () use ($guild_id) {
            return self::callBotApi('GET', "/guilds/{$guild_id}");
        });
    }

    public static function getGuildRoles(string $guild_id, bool $select_format = false): array
    {
        $data = self::cacheValidResponse("discord_guild_{$guild_id}_roles", 15, function () use ($guild_id) {
            return self::callBotApi('GET', "/guilds/{$guild_id}/roles");
        });

        if ($data === null) {
            return [];
        }

        if (! $select_format) {
            return $data;
        }

        return collect($data)
            ->filter(fn ($role) => $role['id'] !== $guild_id)
            ->map(fn ($role) => [
                'id' => $role['id'],
                'name' => $role['name'],
                'color' => $role['color'],
            ])->values()->toArray();
    }

    public static function getGuildChannels(string $guild_id, bool $select_format = false, ?array $allowed_types = null): array
    {
        $cache_key = "discord_guild_{$guild_id}_channels_".($select_format ? 'select' : 'raw');

        if ($allowed_types !== null) {
            $cache_key .= '_'.implode('_', $allowed_types);
        }

        $result = self::cacheValidResponse($cache_key, 15, function () use ($guild_id, $select_format, $allowed_types) {
            $data = self::callBotApi('GET', "/guilds/{$guild_id}/channels");

            if ($data === null) {
                return null;
            }

            $collection = collect($data);

            if ($allowed_types !== null) {
                $collection = $collection->filter(fn ($ch) => in_array($ch['type'], $allowed_types));
            }

            if ($select_format) {
                $collection = $collection->map(fn ($ch) => [
                    'id' => $ch['id'],
                    'name' => $ch['name'],
                    'type' => $ch['type'],
                ]);
            }

            return $collection->values()->toArray();
        });

        return $result ?? [];
    }

    public static function getGuildCategories(string $guild_id): array
    {
        return self::getGuildChannels($guild_id, true, [4]);
    }

    public static function getGuildMembers(string $guild_id, bool $select_format = false, ?int $filter = null): array
    {
        $cache_filter = $filter ?? 0;
        $cache_key = "discord_guild_{$guild_id}_members_".($select_format ? 'select' : 'raw')."_{$cache_filter}";

        $result = self::cacheValidResponse($cache_key, 15, function () use ($guild_id, $select_format, $filter) {
            $data = self::callBotApi('GET', "/guilds/{$guild_id}/members");

            if ($data === null) {
                return null;
            }

            $collection = collect($data);

            if ($filter === 1 || $filter === 2) {
                $db_user_ids = GuildUser::where('guild_id', $guild_id)->pluck('user_id')->toArray();

                $collection = $collection->filter(function ($member) use ($db_user_ids, $filter) {
                    $is_in_db = in_array((string) $member['user']['id'], $db_user_ids);

                    return $filter === 1 ? $is_in_db : ! $is_in_db;
                });
            }

            if (! $select_format) {
                return $collection->values()->toArray();
            }

            return $collection->map(fn ($member) => [
                'value' => (string) $member['id'],
                'label' => $member['globalName'] ?? $member['username'],
                'name' => $member['username'],
            ])->values()->toArray();
        });

        return $result ?? [];
    }

    public static function getGuildMemberIds(string $guild_id): array
    {
        $result = self::cacheValidResponse("discord_guild_{$guild_id}_member_ids", 15, function () use ($guild_id) {
            $data = self::callBotApi('GET', "/guilds/{$guild_id}/members");

            return $data !== null ? collect($data)->pluck('id')->toArray() : null;
        });

        return $result ?? [];
    }

    public static function getGuildBans(string $guild_id): array
    {
        $result = self::cacheValidResponse("discord_guild_{$guild_id}_bans", 15, function () use ($guild_id) {
            return self::callBotApi('GET', "/guilds/{$guild_id}/bans");
        });

        return $result ?? [];
    }

    public static function getMemberDetails(string $guild_id, string $user_id): ?array
    {
        return self::callBotApi('GET', "/guilds/{$guild_id}/members/{$user_id}");
    }

    public static function getMemberRoles(string $guild_id, string $user_id): ?array
    {
        return self::callBotApi('GET', "/guilds/{$guild_id}/members/{$user_id}/roles");
    }

    public static function getUserPermissions(string $guild_id, string $user_id): array
    {
        $result = self::cacheValidResponse("guild_{$guild_id}_user_{$user_id}_permissions", 15, function () use ($guild_id, $user_id) {
            $member = self::callBotApi('GET', "/guilds/{$guild_id}/members/{$user_id}");

            if ($member === null) {
                return null;
            }

            $user_roles = collect($member['roles'] ?? [])->pluck('id')->toArray();

            $settings = GuildSettings::where('guild_id', $guild_id)->first();
            $role_mapping = $settings?->feature_settings['general_settings']['role_permissions'] ?? [];

            $user_permissions = collect($user_roles)
                ->map(fn ($role_id) => $role_mapping[$role_id] ?? [])
                ->flatten()
                ->unique()
                ->values()
                ->toArray();

            return [
                'permissions' => $user_permissions,
                'last_fetched_at' => now()->toDateTimeString(),
            ];
        });

        return $result ?? ['permissions' => [], 'last_fetched_at' => now()->toDateTimeString()];
    }

    /**
     * Aszinkron feladat küldése a Botnak a Redis-en keresztül.
     */
    private static function dispatchToBot(string $action, array $payload): bool
    {
        try {
            $data = array_merge(['action' => $action], $payload);
            Redis::rpush('discord_bot_tasks', json_encode($data));

            return true;
        } catch (\Exception $e) {
            Log::error('Hiba a Discord feladat Redis-be küldésekor: '.$e->getMessage());

            return false;
        }
    }

    public static function addRoleToMember(string $guild_id, string $user_id, string $role_id): bool
    {
        return self::dispatchToBot('add_role', [
            'guild_id' => $guild_id,
            'user_id' => $user_id,
            'role_id' => $role_id,
        ]);
    }

    public static function removeRoleFromMember(string $guild_id, string $user_id, string $role_id): bool
    {
        return self::dispatchToBot('remove_role', [
            'guild_id' => $guild_id,
            'user_id' => $user_id,
            'role_id' => $role_id,
        ]);
    }

    public static function kickMember(string $guild_id, string $user_id, string $reason = ''): bool
    {
        return self::dispatchToBot('kick', [
            'guild_id' => $guild_id,
            'user_id' => $user_id,
            'reason' => $reason,
        ]);
    }

    public static function banMember(string $guild_id, string $user_id, string $reason = '', int $delete_message_seconds = 0): bool
    {
        return self::dispatchToBot('ban', [
            'guild_id' => $guild_id,
            'user_id' => $user_id,
            'reason' => $reason,
            'delete_message_seconds' => $delete_message_seconds,
        ]);
    }

    public static function sendMessage(string $channel_id, ?string $content = null, array $embeds = [], array $components = []): bool
    {
        return self::dispatchToBot('send_message', [
            'channel_id' => $channel_id,
            'content' => $content,
            'embeds' => $embeds,
            'components' => $components,
        ]);
    }
}
