<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AddBotToGuildRequest;
use App\Models\Guild;
use App\Services\Api\GuildService;
use Illuminate\Http\JsonResponse;

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

    public function getGuildSettings(Guild $guild): JsonResponse
    {
        return $guild->guildSettings->toJson();
    }
}
