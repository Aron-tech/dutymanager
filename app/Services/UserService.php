<?php

namespace App\Services;

use App\Models\User;

class UserService
{
    private bool $is_api_call = false;

    private ?User $user;

    /**
     * @param bool $is_api_call
     * @return void
     */
    public function setIsApiCall(bool $is_api_call): void
    {
        $this->is_api_call = $is_api_call;
    }
}
