<?php

namespace App\Services;

use App\Enums\PermissionEnum;
use App\Models\Guild;
use App\Models\GuildSettings;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;
use Throwable;

readonly class GuildSettingsService
{
    /**
     * @param GuildSettings $guild_settings
     * @param array $enabled_features
     * @param array $settings
     * @return void
     * @throws Throwable
     */
    public function updateSettings(GuildSettings $guild_settings, array $enabled_features, array $settings): void
    {
        $old_user_details_config = $guild_settings->user_details_config;

        DB::transaction(function () use ($guild_settings, $enabled_features, $settings, $old_user_details_config): void {
            $feature_settings = $guild_settings->feature_settings ?? [];

            $userDetailsConfig = [];
            if (isset($settings['user_details']['config']) && is_array($settings['user_details']['config'])) {
                $userDetailsConfig = $settings['user_details']['config'];
                unset($settings['user_details']['config']);
            } elseif (isset($settings['user_details'])) {
                $userDetailsConfig = $settings['user_details'];
            }

            // Generate key and sort for canonical representation
            if (is_array($userDetailsConfig)) {
                foreach ($userDetailsConfig as &$config) {
                    if (isset($config['name']) && !isset($config['key'])) {
                        $config['key'] = Str::slug($config['name'], '_');
                    }
                }
                // Sort by key to ensure canonical representation
                $userDetailsConfig = collect($userDetailsConfig)->sortBy('key')->values()->all();
            }

            $guild_settings->user_details_config = $userDetailsConfig;

            if (isset($settings['general'])) {
                $this->syncGuildRoles($guild_settings->guild, $settings['general']);
                unset($settings['general']['role_permissions']);
            }

            $valid_feature_keys = array_merge(['general', 'user_details'], $enabled_features);

            foreach ($valid_feature_keys as $feature_key) {
                if (isset($settings[$feature_key])) {
                    $feature_settings[$feature_key] = $settings[$feature_key];
                }
            }

            foreach (array_keys($feature_settings) as $existing_key) {
                if (! in_array($existing_key, $valid_feature_keys, true)) {
                    unset($feature_settings[$existing_key]);
                }
            }

            $guild_settings->features = $enabled_features;
            $guild_settings->feature_settings = $feature_settings;

            $guild_settings->save();

            // Sort old config as well for accurate comparison
            $old_user_details_config_sorted = is_array($old_user_details_config) ? collect($old_user_details_config)->sortBy('key')->values()->all() : [];

            if ($old_user_details_config_sorted !== $guild_settings->user_details_config) {
                try {
                    Redis::rpush('discord_bot_tasks', json_encode([
                        'action' => 'sync_user_add_command',
                        'guild_id' => $guild_settings->guild_id,
                    ]));
                } catch (Throwable $e) {
                    Log::error('Failed to dispatch sync_user_add_command job to Redis.', [
                        'guild_id' => $guild_settings->guild_id,
                        'error' => $e->getMessage(),
                    ]);
                }
            }
        });
    }

    private function syncGuildRoles(Guild $guild, array $general_settings): void
    {
        $mode = Arr::get($general_settings, 'mode', 'preset');
        $should_reset_cache = false;

        if ($mode === 'preset') {
            $preset_roles = Arr::get($general_settings, 'preset_roles', []);
            $role_permissions = $this->generatePermissionsFromPreset($preset_roles);
        } else {
            $role_permissions = Arr::get($general_settings, 'role_permissions', []);
        }

        $grouped_permissions = [];
        foreach ($role_permissions as $rp) {
            $role_id = $rp['role_id'];
            $grouped_permissions[$role_id][] = $rp['permission'];
        }

        $existing_roles = $guild->guildRoles()->get()->keyBy('role_id');

        foreach ($grouped_permissions as $role_id => $permissions) {
            $permissions = array_values(array_unique($permissions));
            if ($existing_roles->has($role_id)) {
                $existing_roles[$role_id]->update(['permissions' => $permissions]);
                $existing_roles->forget($role_id);
            } else {
                $should_reset_cache = true;
                $guild->guildRoles()->create([
                    'role_id' => $role_id,
                    'permissions' => $permissions,
                ]);
            }
        }

        foreach ($existing_roles as $role) {
            $should_reset_cache = true;
            $role->delete();
        }

        if ($should_reset_cache) {
            $accepted_user_ids = $guild->acceptedGuildUsers()->pluck('user_id');
            foreach ($accepted_user_ids as $accepted_user_id) {
                Cache::forget("guild_{$guild->id}_user_{$accepted_user_id}_permissions");
            }
        }
    }

    private function generatePermissionsFromPreset(array $preset_roles): array
    {
        $permissions = [];
        $preset_map = [
            'user' => PermissionEnum::USER_GROUP,
            'staff' => PermissionEnum::MODERATOR_GROUP,
            'owner' => PermissionEnum::ADMIN_GROUP,
        ];

        foreach ($preset_map as $type => $group) {
            if (isset($preset_roles[$type]) && is_array($preset_roles[$type])) {
                $group_perms = PermissionEnum::ALL->getGroupPermissions($group);

                foreach ($preset_roles[$type] as $role_id) {
                    foreach ($group_perms as $perm) {
                        $permissions[] = [
                            'role_id' => $role_id,
                            'permission' => $perm instanceof PermissionEnum ? $perm->value : $perm,
                        ];
                    }
                }
            }
        }

        return $permissions;
    }
}
