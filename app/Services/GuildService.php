<?php

namespace App\Services;

use App\Actions\JoinUserToGuildAction;
use App\Concerns\ServiceTrait;
use App\Models\Guild;
use App\Models\GuildSettings;
use App\Models\GuildRole;
use Exception;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

class GuildService
{
    use ServiceTrait;

    private ?Guild $guild = null;

    private ?string $lang = null;

    public function loadModel(?Guild $guild = null, ?string $guild_id = null): void
    {
        $this->guild = $guild ?? Guild::findOrFail($guild_id);
        $this->lang = $this->guild->lang_code;
    }

    /**
     * @throws Exception
     */
    private function ensureModelLoaded(): void
    {
        if (! $this->guild) {
            throw new Exception('A Guild modell nincs betöltve a service-ben.');
        }
    }

    /**
     * @throws Throwable
     */
    public function saveEnabledFeatures(array $features, string $next_step): void
    {
        $this->ensureModelLoaded();

        DB::transaction(function () use ($features, $next_step) {
            $guild_settings = GuildSettings::firstOrCreate(
                ['guild_id' => $this->guild->id],
                ['features' => [], 'feature_settings' => [], 'current_view' => 'general_settings']
            );

            $guild_settings->update([
                'features' => $features,
                'current_view' => $next_step,
            ]);
        });
    }

    public function saveFeatures(array $data): bool
    {
        try {
            return \DB::transaction(function () use ($data) {
                $guild_settings = $this->guild->guildSettings()->firstOrCreate(
                    ['guild_id' => $this->guild->id],
                    ['current_view' => 'general_settings', 'is_complete' => false]
                );

                $guild_settings->update([
                    'features' => $data['features'] ?? [],
                    'current_view' => $data['next_view'],
                ]);

                return true;
            });
        } catch (Throwable $e) {
            Log::error('Hiba a guild setup mentésekor: '.$e->getMessage());

            return false;
        }
    }

    /**
     * @throws Throwable
     */
    public function saveFeatureSettings(string $feature_id, array $settings, string $next_step): void
    {
        $this->ensureModelLoaded();

        DB::transaction(function () use ($feature_id, $settings, $next_step) {
            $guild_settings = GuildSettings::firstOrCreate(
                ['guild_id' => $this->guild->id],
                ['features' => [], 'feature_settings' => [], 'current_view' => 'general_settings']
            );

            if ($feature_id === 'general_settings') {
                $this->processGeneralSettings($settings);
                // Remove role_permissions from settings so it's not saved in feature_settings
                unset($settings['role_permissions']);
                unset($settings['preset_roles']); // Usually preset roles are converted into role_permissions logic if any, but we can also remove them to save space if only role_permissions matter, or keep them if needed for UI. Let's keep them for UI just in case.

                // If the user selected 'preset' mode we might want to auto-generate the role_permissions here based on the preset roles.
                // Assuming it's already done in frontend, but if not we should handle it.
            }

            $current_feature_settings = $guild_settings->feature_settings ?? [];
            $current_feature_settings[$feature_id] = $settings;

            $guild_settings->update([
                'feature_settings' => $current_feature_settings,
                'current_view' => $next_step,
            ]);
        });
    }

    private function processGeneralSettings(array $settings): void
    {
        $role_permissions = $settings['role_permissions'] ?? [];

        $mode = $settings['mode'] ?? 'preset';

        // Convert preset mode to role_permissions logic if necessary, or if frontend already sends it in role_permissions we skip
        if ($mode === 'preset') {
           $preset_roles = $settings['preset_roles'] ?? [];
           $role_permissions = $this->generateRolePermissionsFromPreset($preset_roles);
        }

        // Group permissions by role_id
        $grouped_permissions = [];
        foreach ($role_permissions as $rp) {
            $role_id = $rp['role_id'];
            if (!isset($grouped_permissions[$role_id])) {
                $grouped_permissions[$role_id] = [];
            }
            $grouped_permissions[$role_id][] = $rp['permission'];
        }

        // Sync with database
        $existing_roles = GuildRole::where('guild_id', $this->guild->id)->get()->keyBy('role_id');

        foreach ($grouped_permissions as $role_id => $permissions) {
            $permissions = array_unique($permissions);
            if ($existing_roles->has($role_id)) {
                $existing_roles[$role_id]->update(['permissions' => $permissions]);
                $existing_roles->forget($role_id);
            } else {
                GuildRole::create([
                    'guild_id' => $this->guild->id,
                    'role_id' => $role_id,
                    'permissions' => $permissions,
                ]);
            }
        }

        // Delete any roles that were removed
        foreach ($existing_roles as $role) {
            $role->delete();
        }

        // Cache invalidation could happen here if necessary
    }

    private function generateRolePermissionsFromPreset(array $preset_roles): array
    {
         $permissions = [];

         // Define which preset category gets which permissions
         // This is an example, you might want to adjust the actual permissions
         $user_perms = ['view_duties', 'add_duties'];
         $staff_perms = ['view_guild_settings', 'view_guild_users', 'view_duties_stats', 'edit_duties', 'delete_duties', 'add_punishments', 'add_warning', 'add_verbal_warning'];
         $owner_perms = ['edit_settings', 'add_guild_users', 'edit_guild_users', 'delete_guild_users', 'delete_punishments', 'delete_blacklist', 'delete_warning', 'delete_verbal_warning', 'add_blacklist'];

         // In frontend it mentions "A rendszer automatikusan szétosztja a funkciókhoz szükséges jogosultságokat a kategóriák alapján."
         $preset_map = [
             'user' => $user_perms,
             'staff' => array_merge($user_perms, $staff_perms),
             'owner' => ['*'] // wildcard for owners
         ];

         foreach ($preset_map as $type => $perms) {
             if (isset($preset_roles[$type]) && is_array($preset_roles[$type])) {
                 foreach ($preset_roles[$type] as $role_id) {
                     foreach ($perms as $perm) {
                         $permissions[] = [
                             'role_id' => $role_id,
                             'permission' => $perm
                         ];
                     }
                 }
             }
         }

         return $permissions;
    }

    /**
     * @throws Throwable
     */
    public function saveUserDetailsConfig(array $settings, string $next_step): void
    {
        $this->ensureModelLoaded();

        DB::transaction(function () use ($settings, $next_step) {
            $guild_settings = GuildSettings::firstOrCreate(
                ['guild_id' => $this->guild->id]
            );

            $feature_settings = $guild_settings->feature_settings ?? [];
            $feature_settings['user_details'] = [
                'log_channel_id' => trim(Arr::get($settings, 'log_channel_id', '')),
            ];

            $guild_settings->update([
                'feature_settings' => $feature_settings,
                'user_details_config' => Arr::get($settings, 'config', []),
                'current_view' => $next_step,
            ]);
        });
    }

    /**
     * @throws Throwable
     */
    public function finishSetup(): void
    {
        $this->ensureModelLoaded();

        $auth_user = auth()->user();

        DB::transaction(function () use ($auth_user) {
            $guild_settings = GuildSettings::where('guild_id', $this->guild->id)->first();

            if ($guild_settings) {
                $guild_settings->update(['is_complete' => true]);
            }

            JoinUserToGuildAction::run($auth_user, $this->guild, '', [], false, $auth_user, false);
        });
    }

}
