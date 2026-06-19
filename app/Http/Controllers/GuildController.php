<?php

namespace App\Http\Controllers;

use App\Enums\FeatureEnum;
use App\Enums\LanguageEnum;
use App\Enums\PermissionEnum;
use App\Http\Requests\SaveFeatureSettingsRequest;
use App\Http\Requests\SaveFeaturesRequest;
use App\Models\Guild;
use App\Models\LicenseKey;
use App\Services\DiscordFetchService;
use App\Services\GuildService;
use App\Services\SelectedGuildService;
use Exception;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class GuildController extends Controller
{
    public function __construct(
        private readonly GuildService $service
    ) {}

    /**
     * @throws Exception
     */
    public function selector(): RedirectResponse|Response
    {
        if (SelectedGuildService::isSelected()) {
            SelectedGuildService::clear();
        }

        $user = auth()->user();
        $access_token = session('discord_access_token') ?? $user->access_token;

        if (! $access_token) {
            return redirect()->route('login.discord');
        }

        try {
            $guilds = DiscordFetchService::getCategorizedGuilds($access_token, $user);
        } catch (Exception $e) {
            if ($e->getCode() === 401) {
                session()->forget('discord_access_token');

                return redirect()->route('login.discord');
            }
            throw $e;
        }

        return Inertia::render('guilds/selector', [
            'guilds' => $guilds,
            'is_hidden_nav_items' => true,
        ]);
    }

    /**
     * @throws Exception
     */
    public function select(Guild $guild): RedirectResponse|Response
    {
        SelectedGuildService::set($guild);

        $user = auth()->user();
        $access_token = session('discord_access_token') ?? $user->access_token;
        $access_level = $this->service->determineAccessLevel($guild, $user->id, $access_token);

        if ($access_level === 'accepted') {
            return to_route('dashboard');
        }

        if ($access_level === 'pending') {
            return back()->with('error', __('guild_user.error_pending_approval'));
        }

        try {
            $guilds = DiscordFetchService::getCategorizedGuilds($access_token, $user);
        } catch (Exception $e) {
            if ($e->getCode() === 401) {
                session()->forget('discord_access_token');

                return redirect()->route('login.discord');
            }
            throw $e;
        }

        return Inertia::render('guilds/selector', [
            'guilds' => $guilds,
            'is_hidden_nav_items' => true,
            'show_request_modal' => true,
            'target_discord_id' => $guild->id,
            'modal_config_data' => $this->service->getRegistrationConfig($guild),
            'original_url' => route('guilds.selector'),
        ]);
    }

    public function show(): Response
    {
        $guild = SelectedGuildService::get();

        $this->service->loadModel($guild);

        $guild_settings = $guild->guildSettings()->firstOrCreate(
            ['guild_id' => $guild->id],
            ['current_view' => 'general_settings', 'features' => [], 'feature_settings' => [], 'is_complete' => false]
        );

        if (request()->has('current_view')) {
            $guild_settings->current_view = request('current_view');
        }

        $feature_settings = $guild_settings->feature_settings ?? [];
        if (isset($feature_settings['user_details'])) {
            $feature_settings['user_details']['config'] = $guild_settings->user_details_config ?? [];
        }
        $guild_settings->feature_settings = $feature_settings;

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

        $features = collect(FeatureEnum::cases())->map(fn ($feature) => [
            'id' => $feature->value,
            'name' => $feature->getName(),
            'description' => $feature->getDescription(),
        ])->toArray();

        $active_license = LicenseKey::where('guild_id', $guild->id)
            ->latest('used_at')
            ->get()
            ->filter(fn ($lic) => $lic->is_active)
            ->first();

        return Inertia::render('guilds/setup', [
            'guild' => $guild,
            'settings' => $guild_settings,
            'features' => $features,
            'enabled_features' => $guild_settings->features ?? [],
            'context_data' => [
                'guild_id' => $guild->id,
                'license' => [
                    'is_active' => (bool) $active_license,
                    'plan_type' => $active_license?->plan_type,
                    'expires_at' => $active_license?->expires_at,
                ],
                'languages' => $languages,
                'permissions' => $permissions,
                'discord_roles' => $discord_roles,
                'discord_voice_channels' => $discord_voice_channels,
                'discord_text_channels' => $discord_text_channels,
            ],
        ]);
    }

    public function saveFeatures(SaveFeaturesRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $guild = SelectedGuildService::get();
        $this->service->loadModel($guild);
        $success = $this->service->saveFeatures($validated);

        if (! $success) {
            return back()->withInput()->withErrors(['error' => 'Sajnos nem sikerült menteni a beállításokat. Próbáld újra!']);
        }

        return to_route('guild.setup.show');
    }

    /**
     * @throws Throwable
     */
    public function saveFeatureSettings(SaveFeatureSettingsRequest $request, string $feature_id): RedirectResponse
    {
        $guild = SelectedGuildService::get();
        $this->service->loadModel($guild);
        $validated = $request->validated();

        if ($feature_id === 'user_details') {
            $this->service->saveUserDetailsConfig($validated['settings'], $validated['next_view']);
        } else {
            $this->service->saveFeatureSettings($feature_id, $validated['settings'], $validated['next_view']);
        }

        return to_route('guild.setup.show');
    }

    /**
     * @throws Throwable
     */
    public function finish(): RedirectResponse
    {
        $guild = SelectedGuildService::get();

        $this->service->loadModel($guild);
        $this->service->finishSetup();

        if (! $guild->is_installed) {
            return back()->withErrors([
                'installation' => __('A rendszer úgy érzékeli, hogy a bot még nincs inicializálva a Discord szervereden. Kérlek, használd a /install parancsot a folytatáshoz!'),
            ]);
        }

        return to_route('dashboard');
    }
}
