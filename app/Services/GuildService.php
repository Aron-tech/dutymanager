<?php

namespace App\Services;

use App\Actions\JoinUserToGuildAction;
use App\ActionTypeEnum;
use App\Concerns\ServiceTrait;
use App\GlobalRoleEnum;
use App\GuildSelectionStatusEnum;
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

    public function __construct(bool $is_api_call = false)
    {
        $this->is_api_call = $is_api_call;
    }

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

            JoinUserToGuildAction::run($user, $guild, 'N/A', [], false, null);

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
     * @return array{status: GuildSelectionStatusEnum, data?: array}
     */
    public function determineSelectionStatus(Guild $guild, User $user, bool $isAdminOnDiscord): array
    {
        if (! $guild->is_installed) {
            return ['status' => GuildSelectionStatusEnum::NEEDS_INSTALLATION];
        }

        $guild_user = $guild->guildUsers()->where('user_id', $user->id)->first();

        if ($guild_user) {
            return ['status' => GuildSelectionStatusEnum::FULL_ACCESS];
        }

        $has_global_role = $user->global_role === GlobalRoleEnum::ADMIN->value;

        if ($isAdminOnDiscord || $has_global_role) {
            return ['status' => GuildSelectionStatusEnum::LIMITED_ADMIN];
        }

        return [
            'status' => GuildSelectionStatusEnum::NEEDS_REQUEST,
            'data' => [
                'user_config_details' => $guild->settings?->user_config_details ?? [],
            ],
        ];
    }

    public function setIsApiCall(bool $is_api_call): void
    {
        $this->is_api_call = $is_api_call;
    }
}
