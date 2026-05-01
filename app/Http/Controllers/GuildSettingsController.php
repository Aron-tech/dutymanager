<?php

namespace App\Http\Controllers;

use App\Enums\LanguageEnum;
use App\Enums\PermissionEnum;
use App\Http\Requests\UpdateGuildSettingsRequest;
use App\Models\Guild;
use App\Services\DiscordFetchService;
use App\Services\GuildSettingsService;
use App\Services\SelectedGuildService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class GuildSettingsController extends Controller
{
    public function __construct(
        private readonly GuildSettingsService $guildSettingsService
    ) {}

    public function index(): Response
    {
        if (auth()->user()->cannot(PermissionEnum::VIEW_GUILD_SETTINGS)) {
            abort(403, 'app.error_no_permission');
        }

        $guild = SelectedGuildService::get();
        $guild_settings = $guild->guildSettings;

        $initial_settings = $guild_settings?->feature_settings ?? [];

        $initial_settings['general'] = $initial_settings['general'] ?? [];
        $initial_settings['general']['mode'] = $initial_settings['general']['mode'] ?? 'preset';

        $role_permissions = [];
        foreach ($guild->guildRoles as $guild_role) {
            foreach ($guild_role->permissions as $permission) {
                $role_permissions[] = [
                    'role_id' => $guild_role->role_id,
                    'permission' => $permission,
                ];
            }
        }
        $initial_settings['general']['role_permissions'] = $role_permissions;

        $user_details_data = $initial_settings['user_details'] ?? [];
        $user_details_data['config'] = $guild_settings?->user_details_config ?? [];
        $initial_settings['user_details'] = $user_details_data;

        $languages = collect(LanguageEnum::cases())->map(fn ($lang) => [
            'value' => $lang->value,
            'label' => $lang->getLabel(),
        ]);

        $permissions = collect(PermissionEnum::cases())->map(fn ($perm) => [
            'value' => $perm->value,
            'label' => $perm->getLabel(),
        ]);

        $discord_roles = DiscordFetchService::getGuildRoles($guild->id, true);
        $discord_text_channels = DiscordFetchService::getGuildChannels($guild->id, true, [0, 5]);
        $discord_voice_channels = DiscordFetchService::getGuildChannels($guild->id, true, [2]);

        return Inertia::render('guilds/settings', [
            'guild' => $guild,
            'initialSettings' => $initial_settings,
            'initialEnabledFeatures' => $guild_settings?->features ?? [],
            'context_data' => [
                'languages' => $languages,
                'permissions' => $permissions,
                'discord_roles' => $discord_roles,
                'discord_voice_channels' => $discord_voice_channels,
                'discord_text_channels' => $discord_text_channels,
            ],
        ]);
    }

    public function update(UpdateGuildSettingsRequest $request, Guild $guild): RedirectResponse
    {
        if (auth()->user()->cannot(PermissionEnum::EDIT_SETTINGS)) {
            abort(403, 'app.error_no_permission');
        }

        $validated = $request->validated();

        $guild_settings = SelectedGuildService::get()->guildSettings;

        $this->guildSettingsService->updateSettings($guild_settings, $validated['enabled_features'], $validated['settings']);

        return back()->with('success', __('Beállítások sikeresen mentve.'));
    }
}
