<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreGuildRequest;
use App\Http\Requests\UpdateGuildRequest;
use App\Models\Guild;
use App\Models\User;
use App\Services\DiscordFetchService;
use App\Services\GuildService;
use Inertia\Inertia;

class GuildController extends Controller
{
    public function __construct(private readonly GuildService $service)
    {
        $this->service->setIsApiCall(false);
    }

    public function selector()
    {
        $user_id = auth()->id();
        $access_token = session('discord_access_token', null) ?? (User::findOrFail($user_id)->access_token ?? null);
        if (! $access_token) {
            return redirect()->route('login.discord');
        }

        $guilds = (new DiscordFetchService)->getCategorizedGuilds($access_token, $user_id);

        return Inertia::render('guilds/selector', [
            'guilds' => $guilds,
        ]);
    }

    public function selected()
    {
        //
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreGuildRequest $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(Guild $guild)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Guild $guild)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateGuildRequest $request, Guild $guild)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Guild $guild)
    {
        //
    }
}
