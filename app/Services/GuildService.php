<?php

namespace App\Services;

use App\Models\Guild;

class GuildService
{
    private ?Guild $guild;

    public function loadModel(Guild $guild): void
    {
        $this->guild = $guild;
    }
    public function addBotToGuild($data)
    {
    }
}
