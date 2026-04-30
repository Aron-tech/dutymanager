<?php

namespace App\Http\Controllers\Api;

use App\Concerns\ServiceTrait;
use App\DTO\ServiceResponseDTO;
use App\Enums\PermissionEnum;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\DeleteGuildUserRequest;
use App\Http\Requests\Api\StoreGuildUserRequest;
use App\Http\Requests\ToggleDutyRequest;
use App\Http\Requests\UpdateRolesGuildUserRequest;
use App\Models\Guild;
use App\Services\Api\GuildUserService;
use Illuminate\Http\JsonResponse;
use Throwable;

class GuildUserController extends Controller
{
    use ServiceTrait;

    public function __construct(
        private readonly GuildUserService $service
    ) {}

    public function store(StoreGuildUserRequest $request): ServiceResponseDTO
    {
        $data = $request->validated();

        return $this->service->addUserToGuild($data);
    }

    public function delete(DeleteGuildUserRequest $request)
    {
        if (auth()->user()->cannot(PermissionEnum::DELETE_GUILD_USERS)) {
            return response()->json($this->makeResponse(false, null, __('app.error_no_permission'), 403));
        }

    }

    public function toggleDuty(ToggleDutyRequest $request): JsonResponse
    {
        if (auth()->user()->cannot(PermissionEnum::TOGGLE_DUTY)) {
            return response()->json($this->makeResponse(false, null, __('app.error_no_permission'), 403));
        }

        $data = $request->validated();

        return response()->json($this->service->toggleDuty($data));
    }

    /**
     * @throws Throwable
     */
    public function updateRoles(Guild $guild, UpdateRolesGuildUserRequest $request)
    {
        $validated = $request->validated();

        return response()->json($this->service->updateRoles($guild, $validated));
    }
}
