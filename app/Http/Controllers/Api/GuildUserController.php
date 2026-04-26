<?php

namespace App\Http\Controllers\Api;

use App\DTO\ServiceResponseDTO;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreGuildUserRequest;
use App\Http\Requests\ToggleDutyRequest;
use App\Http\Requests\UpdateRolesGuildUserRequest;
use App\Models\Guild;
use App\Models\User;
use App\Services\Api\GuildUserService;
use Illuminate\Support\Facades\Cache;

class GuildUserController extends Controller
{
    public function __construct(
        private readonly GuildUserService $service
    ) {}

    public function store(StoreGuildUserRequest $request): ServiceResponseDTO
    {
        $data = $request->validated();

        return $this->service->addUserToGuild($data);
    }

    public function toggleDuty(ToggleDutyRequest $request): ServiceResponseDTO
    {
        $data = $request->validated();

        return $this->service->toggleDuty($data);
    }

    public function updateRoles(UpdateRolesGuildUserRequest $request, Guild $guild, User $user)
    {
        $validated = $request->validated();

        $guild->acceptedGuildUsers()->where('user_id', $user->id)->update([
            'cached_roles' => $validated['role_ids'],
            'roles_last_synced' => now(),
        ]);

        Cache::forget("guild_{$guild->id}_user_{$user->id}_permissions");

        return response()->json(['message' => 'Szerepkörök sikeresen frissítve.']);
    }
}
