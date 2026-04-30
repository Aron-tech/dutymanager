<?php

namespace App\Services;

use App\Enums\PermissionEnum;
use App\Models\Guild;
use App\Models\GuildSettings;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
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
        DB::transaction(function () use ($guild_settings, $enabled_features, $settings): void {
            $feature_settings = $guild_settings->feature_settings ?? [];

            // User Details konfiguráció kezelése
            if (isset($settings['user_details']['config']) && is_array($settings['user_details']['config'])) {
                $guild_settings->user_details_config = $settings['user_details']['config'];
                unset($settings['user_details']['config']);
            } elseif (isset($settings['user_details'])) {
                $guild_settings->user_details_config = $settings['user_details'];
            }

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
        });
    }

    private function syncGuildRoles(Guild $guild, array $general_settings): void
    {
        $mode = Arr::get($general_settings, 'mode', 'preset');
        $role_permissions = [];

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
                $guild->guildRoles()->create([
                    'role_id' => $role_id,
                    'permissions' => $permissions,
                ]);
            }
        }

        foreach ($existing_roles as $role) {
            $role->delete();
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
