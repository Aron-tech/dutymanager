<?php

namespace App\Services;

use App\Concerns\ServiceTrait;
use App\Models\Duty;
use App\Models\Guild;

class DutyService
{
    use ServiceTrait;

    private ?Guild $guild;

    private bool $is_api_call = false;

    private ?string $lang = null;

    public function __construct(bool $is_api_call = false)
    {
        $this->is_api_call = $is_api_call;
    }

    public function loadModel(?Duty $duty, ?int $duty_id): void
    {
        $this->guild = $guild ?? Duty::findOrFail($duty_id);
        $this->lang = $this->guild->lang_code;
    }

    public function setIsApiCall(bool $is_api_call): void
    {
        $this->is_api_call = $is_api_call;
    }
}
