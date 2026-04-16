<?php

namespace App\Services;

use App\Enums\GlobalRoleEnum;
use App\Models\Guild;
use App\Models\GuildSettings;
use App\Models\GuildUser;
use App\Models\User;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class DiscordFetchService
{
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

    /**
     * Kategóriák (4) lekérése
     */
    public static function getGuildCategories(string $bot_token, string $guild_id): array
    {
        $all_channels = collect(self::fetchRawGuildChannels($bot_token, $guild_id));

        return $all_channels
            ->where('type', 4)
            ->map(fn ($channel) => [
                'id' => $channel['id'],
                'name' => $channel['name'],
            ])
            ->values()
            ->toArray();
    }

    /**
     * Szerver tagjainak lekérése (csak ID-k)
     * FIGYELEM: 1000 tagig működik lapozás nélkül.
     */
    public static function getGuildMemberIds(string $bot_token, string $guild_id): array
    {
        $cache_key = "discord_guild_members_{$guild_id}";

        return Cache::remember($cache_key, now()->addMinutes(10), function () use ($bot_token, $guild_id) {
            $response = Http::withHeaders([
                'Authorization' => 'Bot '.$bot_token,
            ])->get("https://discord.com/api/guilds/{$guild_id}/members", [
                'limit' => 1000,
            ]);

            if (! $response->successful()) {
                return [];
            }

            return collect($response->json())
                ->pluck('user.id')
                ->toArray();
        });
    }

    /**
     * Aktuális felhasználó adatainak lekérése
     */
    public static function getUserProfile(string $user_token): ?array
    {
        $cache_key = 'discord_user_profile_'.md5($user_token);

        return Cache::remember($cache_key, now()->addMinutes(15), function () use ($user_token) {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer '.$user_token,
            ])->get('https://discord.com/api/users/@me');

            return $response->successful() ? $response->json() : null;
        });
    }

    private static function fetchRawGuilds(string $token, string $user_id): array
    {
        $cache_key = "discord_guilds_user_{$user_id}";

        return Cache::remember($cache_key, now()->addMinutes(5), function () use ($token) {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer '.$token,
            ])->get('https://discord.com/api/users/@me/guilds');

            return $response->successful() ? $response->json() : [];
        });
    }

    /**
     * Közös metódus a csatornák és kategóriák lekérésére (optimalizáció)
     */
    private static function fetchRawGuildChannels(string $bot_token, string $guild_id): array
    {
        $cache_key = "discord_guild_channels_{$guild_id}";

        return Cache::remember($cache_key, now()->addMinutes(15), function () use ($bot_token, $guild_id) {
            $response = Http::withHeaders([
                'Authorization' => 'Bot '.$bot_token,
            ])->get("https://discord.com/api/guilds/{$guild_id}/channels");

            return $response->successful() ? $response->json() : [];
        });
    }

    /**
     * @throws ConnectionException
     */
    public static function getGuildData(string $guild_id, ?string $data_type = null): array
    {
        $bot_token = config('services.discord.token');

        $url = "https://discord.com/api/v10/guilds/{$guild_id}";
        if ($data_type !== null) {
            $url .= '/'.ltrim($data_type, '/');
        }

        $response = Http::withHeaders([
            'Authorization' => 'Bot '.$bot_token,
        ])->get($url);

        return $response->successful() ? $response->json() : [];
    }

    public static function getGuildRoles(string $guild_id, bool $select_format = false): array
    {
        return Cache::remember("discord_guild_{$guild_id}_roles", now()->addMinutes(15), function () use ($select_format, $guild_id) {
            $data = self::getGuildData($guild_id, 'roles');

            if (empty($data)) {
                return $data;
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
        });
    }

    /**
     * Lekérdezi egy szerver csatornáit.
     * * Discord csatorna típusok (néhány gyakori):
     * 0 = Text, 2 = Voice, 4 = Category, 5 = Announcement
     */
    public static function getGuildChannels(string $discord_id, bool $select_format = false, ?array $allowed_types = null): array
    {
        $cache_key = "discord_guild_{$discord_id}_channels_".($select_format ? 'select' : 'raw');

        if ($allowed_types !== null) {
            $cache_key .= '_'.implode('_', $allowed_types);
        }

        return Cache::remember($cache_key, now()->addMinutes(15), function () use ($discord_id, $select_format, $allowed_types) {
            $data = self::getGuildData($discord_id, 'channels');

            if (empty($data)) {
                return [];
            }

            $collection = collect($data);

            if ($allowed_types !== null) {
                $collection = $collection->filter(fn ($channel) => in_array($channel['type'], $allowed_types));
            }

            if ($select_format) {
                $collection = $collection->map(fn ($channel) => [
                    'id' => $channel['id'],
                    'name' => $channel['name'],
                    'type' => $channel['type'],
                ]);
            }

            return $collection->values()->toArray();
        });
    }

    /**
     * @param string $guild_id
     * @param bool $select_format
     * @param int|null $filter
     * @return array
     */
    public static function getGuildMembers(string $guild_id, bool $select_format, ?int $filter = null): array
    {
        $cache_filter = $filter ?? 0;
        $cache_key = "discord_guild_{$guild_id}_members_".($select_format ? 'select' : 'raw')."_{$cache_filter}";

        return Cache::remember($cache_key, now()->addMinutes(15), function () use ($guild_id, $select_format, $filter) {
            $bot_token = config('services.discord.token');
            $response = Http::withHeaders([
                'Authorization' => 'Bot '.$bot_token,
            ])->get("https://discord.com/api/v10/guilds/{$guild_id}/members", [
                'limit' => 1000,
            ]);

            if (! $response->successful()) {
                return [];
            }

            $discord_members = $response->json();
            $member_collection = collect($discord_members);

            if ($filter === 1 || $filter === 2) {
                $db_user_ids = GuildUser::where('guild_id', $guild_id)->pluck('user_id')->toArray();

                $member_collection = $member_collection->filter(function ($member) use ($db_user_ids, $filter) {
                    $user_id = (string) $member['user']['id'];
                    $is_in_db = in_array($user_id, $db_user_ids);

                    return $filter === 1 ? $is_in_db : ! $is_in_db;
                });
            }

            if (! $select_format) {
                return $member_collection->values()->toArray();
            }

            return $member_collection->map(function ($member) {
                $display_name = $member['user']['global_name'] ?? $member['user']['username'];
                $name = $member['user']['username'];

                return [
                    'value' => (string) $member['user']['id'],
                    'label' => $display_name,
                    'name' => $name,
                ];
            })->values()->toArray();
        });
    }

    /**
     * Lekéri egy specifikus felhasználóhoz tartozó feloldott jogosultságokat a Discord rangjai alapján.
     * Szintén 12 óráig cacheljük a "kiszámolt" jogosultságokat.
     */
    public static function getUserPermissions(string $guildId, string $userId): array
    {
        return Cache::remember("guild_{$guildId}_user_{$userId}_permissions", now()->addMinutes(15), function () use ($guildId, $userId) {
            $token = config('services.discord.token');
            $response = Http::withToken($token, 'Bot')
                ->get("https://discord.com/api/v10/guilds/{$guildId}/members/{$userId}");

            if ($response->failed()) {
                return [
                    'permissions' => [],
                    'last_fetched_at' => now()->toDateTimeString(),
                ];
            }

            $userRoles = $response->json('roles') ?? [];

            $settings = GuildSettings::where('guild_id', $guildId)->first();
            $roleMapping = $settings?->feature_settings['general_settings']['role_permissions'] ?? [];

            $userPermissions = collect($userRoles)
                ->map(fn ($roleId) => $roleMapping[$roleId] ?? [])
                ->flatten()
                ->unique()
                ->values()
                ->toArray();

            return [
                'permissions' => $userPermissions,
                'last_fetched_at' => now()->toDateTimeString(),
            ];
        });
    }
}
