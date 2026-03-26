<?php

namespace App\Services\Api;

use App\Actions\JoinUserToGuildAction;
use App\ActionTypeEnum;
use App\Concerns\ServiceTrait;
use App\Models\ActivityLog;
use App\Models\Guild;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

class GuildService
{
    use ServiceTrait;

    private ?Guild $guild;

    private ?string $lang = null;

    public function loadModel(?Guild $guild = null, ?string $guild_id = null): void
    {
        $this->guild = $guild ?? Guild::findOrFail($guild_id);
        $this->lang = $this->guild->lang_code;
    }

    /**
     * @throws Throwable
     */
    public function addBotToGuild(array $data): Guild
    {
        DB::beginTransaction();

        try {
            $this->guild = Guild::createOrRestore(
                ['id' => $data['id']],
                [
                    'name' => $data['name'],
                    'owner_id' => $data['owner_id'],
                    'lang_code' => $data['lang_code'],
                ]
            );

            ActivityLog::make($this->guild->id, null, null, ActionTypeEnum::ADD_BOT_TO_GUILD, $data);

            DB::commit();

            return $this->guild;

        } catch (Throwable $exception) {
            DB::rollBack();
            Log::error('Sikertelen bot hozzáadás: '.$exception->getMessage());
            throw $exception;
        }
    }
}
