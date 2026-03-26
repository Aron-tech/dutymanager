<?php

namespace App\Http\Controllers;

use App\Http\Requests\SaveFeatureSettingsRequest;
use App\Http\Requests\SaveFeaturesRequest;
use App\Models\Guild;
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
        ]);
    }

    public function select(Guild $guild)
    {
        $user = auth()->user();

        SelectedGuildService::set($guild);

        return to_route('dashboard');
    }

    /**
     * @param Guild $guild
     * @return Response
     */
    public function show(Guild $guild): Response
    {
        $guild_settings = $guild->guildSettings()->firstOrCreate(
            ['guild_id' => $guild->id],
            ['current_step' => 0, 'features' => [], 'feature_settings' => []]
        );

        return Inertia::render('guilds/setup', [
            'guild' => $guild,
            'settings' => $guild_settings,
            'context_data' => [],
        ]);
    }

    /**
     * @param SaveFeaturesRequest $request
     * @param Guild $guild
     * @return RedirectResponse
     * @throws Exception
     */
    public function saveFeatures(SaveFeaturesRequest $request, Guild $guild): RedirectResponse
    {
        $validated = $request->validated();
        $this->service->loadModel($guild);
        $this->service->saveEnabledFeatures($validated['features'], $validated['next_step']);

        return redirect()->route('guild.setup.show', $guild->id);
    }

    /**
     * @param SaveFeatureSettingsRequest $request
     * @param Guild $guild
     * @param string $feature_id
     * @return RedirectResponse
     * @throws Exception
     */
    public function saveFeatureSettings(SaveFeatureSettingsRequest $request, Guild $guild, string $feature_id): RedirectResponse
    {
        $this->service->loadModel($guild);
        $validated = $request->validated();

        $this->service->saveFeatureSettings($feature_id, $validated['settings'], $validated['next_step']);

        return redirect()->route('guild.setup.show', $guild->id);
    }

    /**
     * @param Guild $guild
     * @return RedirectResponse
     * @throws Exception
     */
    public function finish(Guild $guild): RedirectResponse
    {
        $this->service->loadModel($guild);
        $this->service->finishSetup();

        return to_route('dashboard');
    }
}
