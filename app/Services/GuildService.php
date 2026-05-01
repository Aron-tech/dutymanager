<?php

namespace App\Services;

use App\Actions\JoinUserToGuildAction;
use App\Concerns\ServiceTrait;
use App\Enums\PermissionEnum;
use App\Models\Guild;
use App\Models\GuildRole;
use App\Models\GuildSettings;
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
            return DB::transaction(function () use ($data) {
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
                unset($settings['role_permissions']);
                unset($settings['preset_roles']);
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
        $mode = $settings['mode'] ?? 'preset';
        $role_permissions = $settings['role_permissions'] ?? [];

        if ($mode === 'preset') {
            $preset_roles = $settings['preset_roles'] ?? [];
            $role_permissions = $this->generateRolePermissionsFromPreset($preset_roles);
        }

        $grouped_permissions = [];
        foreach ($role_permissions as $rp) {
            $role_id = $rp['role_id'];
            if (! isset($grouped_permissions[$role_id])) {
                $grouped_permissions[$role_id] = [];
            }
            $grouped_permissions[$role_id][] = $rp['permission'];
        }

        $existing_roles = GuildRole::where('guild_id', $this->guild->id)->get()->keyBy('role_id');

        foreach ($grouped_permissions as $role_id => $permissions) {
            $permissions = array_values(array_unique($permissions));
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

        foreach ($existing_roles as $role) {
            $role->delete();
        }
    }

    private function generateRolePermissionsFromPreset(array $preset_roles): array
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
                'require_real_name' => filter_var(Arr::get($settings, 'require_real_name', false), FILTER_VALIDATE_BOOLEAN),
                'name_format' => trim(Arr::get($settings, 'name_format', '')),
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

    /**
     * @param Guild $guild
     * @param string $user_id
     * @return string
     */
    public function determineAccessLevel(Guild $guild, string $user_id): string
    {
        if ($user_id === $guild->owner_id) {
            return 'accepted';
        }

        /** @var GuildUser|null $guild_user */
        $guild_user = $guild->guildUsers()->where('user_id', $user_id)->first();

        if ($guild_user === null) {
            return 'requires_request';
        }

        if ($guild_user->accepted_at !== null) {
            return 'accepted';
        }

        return 'pending';
    }

    /**
     * @param Guild $guild
     * @return array
     */
    public function getRegistrationConfig(Guild $guild): array
    {
        return $guild->guildSettings?->user_details_config ?? [];
    }
}
