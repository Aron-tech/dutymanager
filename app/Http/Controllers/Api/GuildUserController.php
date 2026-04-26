<?php

namespace App\Http\Controllers\Api;

use App\DTO\ServiceResponseDTO;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreGuildUserRequest;
use App\Http\Requests\ToggleDutyRequest;
use App\Services\Api\GuildUserService;

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
}
