<?php

namespace App\Services;

use App\ActionTypeEnum;
use App\Concerns\ServiceTrait;
use App\Models\ActivityLog;
use App\Models\Guild;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Throwable;

class GuildService
{
    use ServiceTrait;

    private ?Guild $guild;

    private bool $is_api_call = false;

    private ?string $lang = null;

    /**
     * @param bool $is_api_call
     */
    public function __construct(bool $is_api_call = false)
    {
        $this->is_api_call = $is_api_call;
    }

    /**
     * @param Guild|null $guild
     * @param string|null $guild_id
     * @return void
     */
    public function loadModel(?Guild $guild = null, ?string $guild_id = null): void
    {
        $this->guild = $guild ?? Guild::findOrFail($guild_id);
        $this->lang = $this->guild->lang_code;
    }


    /**
     * @param array $data
     * @return Guild
     * @throws Throwable
     */
    public function addBotToGuild(array $data): Guild
    {
        DB::beginTransaction();

        try {
            $executor_user = User::findOrFail($data['executor_id']);

            $this->guild = Guild::createOrRestore(
                ['id' => $data['id']],
                [
                    'name' => $data['name'],
                    'slug' => Str::slug($data['name']),
                    'owner_id' => $data['owner_id'],
                    'lang_code' => $data['lang_code'],
                    'is_installed' => $data['is_installed'],
                ]
            );

            ActivityLog::make($this->guild->id, $executor_user->id, null, ActionTypeEnum::ADD_BOT_TO_GUILD, null);

            DB::commit();

            return $this->guild;

        } catch (Throwable $exception) {
            DB::rollBack();
            Log::error('Sikertelen bot hozzáadás: '.$exception->getMessage());
            throw $exception;
        }
    }

    /**
     * @param bool $is_api_call
     * @return void
     */
    public function setIsApiCall(bool $is_api_call): void
    {
        $this->is_api_call = $is_api_call;
    }
}
