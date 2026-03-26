<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Api\GuildService;

class UserController extends Controller
{
    public function joinGuild(Guild $guild){}

    public function __construct(private readonly GuildService $service)
    {
        $this->service->setIsApiCall(true);
    }
}
