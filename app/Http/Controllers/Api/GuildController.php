<?php

namespace App\Http\Controllers\Api;

use App\Actions\JoinUserToGuildAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\AddBotToGuildRequest;
use App\Models\Guild;
use App\Models\User;
use App\Services\GuildService;
use Illuminate\Http\Request;

class GuildController extends Controller
{
    public function __construct(private readonly GuildService $service)
    {
        $this->service->setIsApiCall(true);
    }
    public function addBot(AddBotToGuildRequest $request)
    {
        $validated_data = $request->validated();
        $guild = $this->service->addBotToGuild($validated_data);
        $user = User::findOrFail($validated_data['owner_id']);

    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
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
     * Update the specified resource in storage.
     */
    public function update(Request $request, Guild $guild)
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
