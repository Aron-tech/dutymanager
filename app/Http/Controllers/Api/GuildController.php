<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AddBotToGuildRequest;
use App\Http\Requests\Api\GuildRequest;
use App\Http\Requests\IndexGuildSettingsRequest;
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

    public function getGuildSettings(IndexGuildSettingsRequest $request): JsonResponse
    {
        $data = $request->validated();

        return response()->json($this->service->getGuildSettings($data));
    }

    public function getRolesWhitelist(GuildRequest $request)
    {
        $data = $request->validated();
        $guild = Guild::where('id', $data['guild_id'])->with('guildRoles')->installed()->first();
        if (! $guild) {
            return response()->json(['roles' => []]);
        }

        return response()->json(['roles' => $this->service->listRoleWhitelist($guild)]);
    }
}
