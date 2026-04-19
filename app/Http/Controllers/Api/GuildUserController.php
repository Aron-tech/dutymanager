<?php

namespace App\Http\Controllers\Api;

use App\Actions\JoinUserToGuildAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreGuildUserRequest;
use App\Models\Guild;
use App\Models\User;
use App\Services\GuildService;

class GuildUserController extends Controller
{
    public function __construct(
        private readonly GuildService $service
    ) {}

    public function store(StoreGuildUserRequest $request)
    {
        $data = $request->validated();

        $guild = Guild::findOrFail($data['guild_id']);

        $user = User::findOrCreate($data['user_id'], [
            'name' => $data['name'],
            'lang_code' => $data['language'] ?? $guild->lang_code,
        ]);

        $added_by = null;
        if (isset($data['added_by'])) {
            $added_by = User::findOrFail($data['added_by']);
        }

        $guild_user = JoinUserToGuildAction::run($user, $guild, $data['ic_name'], $data['details'] ?? [], $data['is_request'], $added_by);

        return response()->json([
            'guild_user' => $guild_user,
        ]);
    }
}
