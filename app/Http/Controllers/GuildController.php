<?php

namespace App\Http\Controllers;

use App\FeatureEnum;
use App\Http\Requests\SaveFeatureSettingsRequest;
use App\Http\Requests\SaveFeaturesRequest;
use App\LanguageEnum;
use App\Models\Guild;
use App\PermissionEnum;
use App\Services\DiscordFetchService;
use App\Services\GuildService;
use App\Services\SelectedGuildService;
use Exception;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class GuildController extends Controller
{
    public function __construct(
        private readonly GuildService $service
    ) {}

    /**
     * @return RedirectResponse|Response
     *
     * @throws Exception
     */
    public function selector()
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
     * @return RedirectResponse
     */
    public function select(Guild $guild)
    {
        SelectedGuildService::set($guild);

        return to_route('dashboard');
    }

    public function show(): Response
    {
        $guild = SelectedGuildService::get();

        $guild_settings = $guild->guildSettings()->firstOrCreate(
            ['guild_id' => $guild->id],
            ['current_view' => 'general_settings', 'features' => [], 'feature_settings' => [], 'is_complete' => false]
        );

        // Enumok formázása a frontend select mezőihez
        $languages = collect(LanguageEnum::cases())->map(fn ($lang) => [
            'value' => $lang->value,
            'label' => $lang->getLabel(),
        ]);

        $permissions = collect(PermissionEnum::cases())->map(fn ($perm) => [
            'value' => $perm->value,
            'label' => $perm->getLabel(),
        ]);

        $discord_roles = DiscordFetchService::getGuildRoles($guild->id);

        $features = collect(FeatureEnum::cases())->map(fn ($feature) => [
            'id' => $feature->value,
            'name' => $feature->getName(),
            'description' => $feature->getDescription(),
        ])->toArray();

        return Inertia::render('guilds/setup', [
            'guild' => $guild,
            'settings' => $guild_settings,
            'features' => $features,
            'enabled_features' => $guild_settings->features ?? [],
            'context_data' => [
                'languages' => $languages,
                'permissions' => $permissions,
                'discord_roles' => $discord_roles,
            ],
        ]);
    }

    /**
     * @throws \Throwable
     */
    public function saveFeatures(SaveFeaturesRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $guild = SelectedGuildService::get();

        \DB::transaction(function () use ($guild, $validated) {
            $guild_settings = $guild->guildSettings()->firstOrCreate(
                ['guild_id' => $guild->id],
                ['current_view' => 'general_settings', 'is_complete' => false]
            );

            $guild_settings->update([
                'features' => $validated['features'] ?? [],
                'current_view' => $validated['next_view'],
            ]);
        });

        return back();
    }

    /**
     * @throws Exception
     */
    public function saveFeatureSettings(SaveFeatureSettingsRequest $request, string $feature_id): RedirectResponse
    {
        $guild = SelectedGuildService::get();
        $this->service->loadModel($guild);
        $validated = $request->validated();

        // Ha a user_details-t mentjük, ahhoz a speciális tisztító logikát hívjuk
        if ($feature_id === 'user_details') {
            $this->service->saveUserDetailsConfig($validated['settings'], $validated['next_view']);
        } else {
            // Minden más feature mehet a generikus mentésbe
            $this->service->saveFeatureSettings($feature_id, $validated['settings'], $validated['next_view']);
        }

        return back();
    }

    /**
     * @throws Exception
     */
    public function finish(): RedirectResponse
    {
        $guild = SelectedGuildService::get();
        $this->service->loadModel($guild);
        $this->service->finishSetup();

        return back();
    }
}
