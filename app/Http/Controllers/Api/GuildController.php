<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AddBotToGuildRequest;
use App\Models\Guild;
use App\Services\Api\GuildService;
use Illuminate\Http\Request;

class GuildController extends Controller
{
    public function __construct(private readonly GuildService $service) {}

    /**
     * @return void
     *
     * @throws \Throwable
     */
    public function addBot(AddBotToGuildRequest $request)
    {
        $validated_data = $request->validated();
        $this->service->addBotToGuild($validated_data);
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
