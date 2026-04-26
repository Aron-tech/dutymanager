<?php

namespace App\Services;

use App\Enums\GlobalRoleEnum;
use App\Models\Guild;
use App\Models\GuildSettings;
use App\Models\GuildUser;
use App\Models\User;
use DateTimeInterface;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class DiscordFetchService
{
    private static function callBotApi(string $method, string $endpoint, array $payload = []): mixed
    {
        $botApiUrl = config('services.bot_api.url', 'http://localhost:3000');
        $botApiKey = config('services.bot_api.key');

        $url = rtrim($botApiUrl, '/').'/'.ltrim($endpoint, '/');

        $request = Http::withHeaders([
            'x-api-key' => $botApiKey,
            'Accept' => 'application/json',
        ]);

        try {
            $response = strtolower($method) === 'get'
                ? $request->get($url, $payload)
                : $request->post($url, $payload);

            if (! $response->successful()) {
                Log::error("Discord Bot API hiba ({$endpoint}): ".$response->body());

                return null;
            }

            return $response->json();
        } catch (\Exception $e) {
            Log::error('Discord Bot API kapcsolódási hiba: '.$e->getMessage());

            return null;
        }
    }

    private static function fetchRawGuilds(string $token, string $user_id): array
    {
        return Cache::remember("discord_guilds_user_{$user_id}", now()->addMinutes(5), function () use ($token) {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer '.$token,
            ])->get('https://discord.com/api/users/@me/guilds');

            return $response->successful() ? $response->json() : [];
        });
    }

    public static function getUserProfile(string $user_token): ?array
    {
        return Cache::remember('discord_user_profile_'.md5($user_token), now()->addMinutes(15), function () use ($user_token) {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer '.$user_token,
            ])->get('https://discord.com/api/users/@me');

            return $response->successful() ? $response->json() : null;
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
        return Cache::remember("discord_guild_{$guild_id}", now()->addMinutes(15), function () use ($guild_id) {
            return self::callBotApi('GET', "/guilds/{$guild_id}");
        });
    }

    public static function getGuildRoles(string $guild_id, bool $select_format = false): array
    {
        $data = Cache::remember("discord_guild_{$guild_id}_roles", now()->addMinutes(15), function () use ($guild_id) {
            return self::callBotApi('GET', "/guilds/{$guild_id}/roles") ?? [];
        });

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

        return Cache::remember($cache_key, now()->addMinutes(15), function () use ($guild_id, $select_format, $allowed_types) {
            $data = self::callBotApi('GET', "/guilds/{$guild_id}/channels") ?? [];

            if (empty($data)) {
                return [];
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
    }

    public static function getGuildCategories(string $guild_id): array
    {
        return self::getGuildChannels($guild_id, true, [4]);
    }

    public static function getGuildMembers(string $guild_id, bool $select_format = false, ?int $filter = null): array
    {
        $cache_filter = $filter ?? 0;
        $cache_key = "discord_guild_{$guild_id}_members_".($select_format ? 'select' : 'raw')."_{$cache_filter}";

        return Cache::remember($cache_key, now()->addMinutes(15), function () use ($guild_id, $select_format, $filter) {
            $data = self::callBotApi('GET', "/guilds/{$guild_id}/members") ?? [];

            if (empty($data)) {
                return [];
            }

            $collection = collect($data);

            if ($filter === 1 || $filter === 2) {
                $db_user_ids = GuildUser::where('guild_id', $guild_id)->pluck('user_id')->toArray();

                $collection = $collection->filter(function ($member) use ($db_user_ids, $filter) {
                    $is_in_db = in_array((string) $member['id'], $db_user_ids);

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
    }

    public static function getGuildMemberIds(string $guild_id): array
    {
        return Cache::remember("discord_guild_{$guild_id}_member_ids", now()->addMinutes(10), function () use ($guild_id) {
            $data = self::callBotApi('GET', "/guilds/{$guild_id}/members") ?? [];

            return collect($data)->pluck('id')->toArray();
        });
    }

    public static function getGuildBans(string $guild_id): array
    {
        return Cache::remember("discord_guild_{$guild_id}_bans", now()->addMinutes(10), function () use ($guild_id) {
            return self::callBotApi('GET', "/guilds/{$guild_id}/bans") ?? [];
        });
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
        return Cache::remember("guild_{$guild_id}_user_{$user_id}_permissions", now()->addMinutes(15), function () use ($guild_id, $user_id) {
            $member = self::callBotApi('GET', "/guilds/{$guild_id}/members/{$user_id}");

            if (! $member) {
                return ['permissions' => [], 'last_fetched_at' => now()->toDateTimeString()];
            }

            $user_roles = collect($member['roles'] ?? [])->pluck('id')->toArray();

            $settings = GuildSettings::where('guild_id', $guild_id)->first();
            $roleMapping = $settings?->feature_settings['general_settings']['role_permissions'] ?? [];

            $user_permissions = collect($user_roles)
                ->map(fn ($roleId) => $roleMapping[$roleId] ?? [])
                ->flatten()
                ->unique()
                ->values()
                ->toArray();

            return [
                'permissions' => $user_permissions,
                'last_fetched_at' => now()->toDateTimeString(),
            ];
        });
    }

    public static function addRoleToMember(string $guild_id, string $user_id, string $role_id): bool
    {
        $response = self::callBotApi('POST', "/guilds/{$guild_id}/members/{$user_id}/roles/add", [
            'roleId' => $role_id,
        ]);

        return isset($response['success']) && $response['success'] === true;
    }

    public static function removeRoleFromMember(string $guild_id, string $user_id, string $role_id): bool
    {
        $response = self::callBotApi('POST', "/guilds/{$guild_id}/members/{$user_id}/roles/remove", [
            'roleId' => $role_id,
        ]);

        return isset($response['success']) && $response['success'] === true;
    }

    public static function kickMember(string $guild_id, string $user_id, string $reason = ''): bool
    {
        $response = self::callBotApi('POST', "/guilds/{$guild_id}/members/{$user_id}/kick", [
            'reason' => $reason,
        ]);

        return isset($response['success']) && $response['success'] === true;
    }

    public static function banMember(string $guild_id, string $user_id, string $reason = '', int $delete_message_seconds = 0): bool
    {
        $response = self::callBotApi('POST', "/guilds/{$guild_id}/members/{$user_id}/ban", [
            'reason' => $reason,
            'deleteMessageSeconds' => $delete_message_seconds,
        ]);

        return isset($response['success']) && $response['success'] === true;
    }

    public static function unbanMember(string $guild_id, string $user_id, string $reason = ''): bool
    {
        $response = self::callBotApi('POST', "/guilds/{$guild_id}/members/{$user_id}/unban", [
            'reason' => $reason,
        ]);

        return isset($response['success']) && $response['success'] === true;
    }

    public static function timeoutMember(string $guild_id, string $user_id, ?\DateTime $until, string $reason = ''): bool
    {
        $response = self::callBotApi('POST', "/guilds/{$guild_id}/members/{$user_id}/timeout", [
            'until' => $until?->format(DateTimeInterface::ATOM),
            'reason' => $reason,
        ]);

        return isset($response['success']) && $response['success'] === true;
    }

    public static function sendMessage(string $channel_id, string $content, array $embeds = []): ?string
    {
        $response = self::callBotApi('POST', "/channels/{$channel_id}/messages", [
            'content' => $content,
            'embeds' => $embeds,
        ]);

        return $response['messageId'] ?? null;
    }

    public static function replyToInteraction(string $interaction_token, string $content, bool $ephemeral = false): bool
    {
        $response = self::callBotApi('POST', '/interactions/reply', [
            'interactionToken' => $interaction_token,
            'content' => $content,
            'ephemeral' => $ephemeral,
        ]);

        return isset($response['success']) && $response['success'] === true;
    }
}
