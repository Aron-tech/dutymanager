<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateGuildRequest;
use App\Http\Requests\UpdateGuildSettingsRequest;
use App\Models\Guild;
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
        $guild = SelectedGuildService::get();

        $guild->load('guildSettings');

        $initial_enabled_features = $guild_settings->features ?? [];

        $initial_settings = $guild_settings->feature_settings ?? [];
        if (isset($guild_settings->user_details_config)) {
            $initial_settings['user_details'] = $guild_settings->user_details_config;
        }

        return Inertia::render('guilds/settings', [
            'guild' => $guild,
            'initialSettings' => $initial_settings,
            'initialEnabledFeatures' => $initial_enabled_features,
        ]);
    }

    public function update(UpdateGuildSettingsRequest $request, Guild $guild): RedirectResponse
    {
        $validated = $request->validated();

        $guild_settings = $guild->guildSettings()->first(['guild_id' => $guild->guild_id]);

        $this->guildSettingsService->updateSettings($guild_settings, $validated['enabled_features'], $validated['settings']);

        return back()->with('success', __('Beállítások sikeresen mentve.'));
    }
}
