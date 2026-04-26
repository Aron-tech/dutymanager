<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateGuildRequest;
use App\Services\SelectedGuildService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class GuildSettingsController extends Controller
{
    public function index(): Response
    {
        $guild = SelectedGuildService::get();

        $guild->load('guildSettings');

        return Inertia::render('guilds/settings', [
            'guild_data' => $guild,
            'enabled_features' => $guild->guildSettings->pluck('features')->toArray(),
        ]);
    }

    public function updateGeneral(UpdateGuildRequest $request): RedirectResponse
    {
        $guild = SelectedGuildService::get();
        $guild->update($request->validated());

        return back()->with('success', __('app.settings_updated'));
    }
}
