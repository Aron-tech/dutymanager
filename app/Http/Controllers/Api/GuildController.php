<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AddBotToGuildRequest;
use App\Http\Requests\Api\GuildRequest;
use App\Http\Requests\IndexGuildSettingsRequest;
use App\Models\Guild;
use App\Services\Api\GuildService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

class GuildController extends Controller
{
    public function __construct(private readonly GuildService $service) {}

    /**
     * @return void
     *
     * @throws Throwable
     */
    public function addBot(AddBotToGuildRequest $request)
    {
        $validated_data = $request->validated();
        $this->service->addBotToGuild($validated_data);
    }

    public function actives(): JsonResponse
    {
        return response()->json(['active_guild_ids' => Guild::installed()->pluck('id')]);
    }

    public function deactivation(Guild $guild)
    {
        DB::beginTransaction();
        try {
            $guild->is_installed = false;
            $guild->save(['is_installed']);
            DB::commit();

            return response()->json(['success' => true]);
        } catch (Throwable $e) {
            DB::rollBack();
            Log::error('Failed when deactivating '.$guild->id.' '.$e->getMessage());

            return response()->json(['success' => false]);
        }
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
