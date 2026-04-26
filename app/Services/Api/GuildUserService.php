<?php

namespace App\Services\Api;

use App\Actions\DeleteActiveDutyAction;
use App\Actions\JoinUserToGuildAction;
use App\Concerns\ServiceTrait;
use App\DTO\ServiceResponseDTO;
use App\Enums\ActionTypeEnum;
use App\Enums\DutyActionEnum;
use App\Enums\FeatureEnum;
use App\Models\ActivityLog;
use App\Models\Guild;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

class GuildUserService
{
    use ServiceTrait;

    public function addUserToGuild(array $data): ServiceResponseDTO
    {
        $guild = Guild::findOrFail($data['guild_id']);

        $user = User::findOrCreate($data['user_id'], [
            'id' => $data['user_id'],
            'name' => $data['name'],
            'lang_code' => $data['language'] ?? $guild->lang_code,
        ]);

        $added_by = null;
        if (isset($data['added_by'])) {
            $added_by = User::findOrFail($data['added_by']);
        }

        // make activitylog the action
        $guild_user = JoinUserToGuildAction::run($user, $guild, $data['ic_name'], $data['details'] ?? [], $data['is_request'], $added_by, $data['use_restore'] ?? false);

        return $this->makeResponse(true, $guild_user, __('guild_user.success_add_new_user', ['user' => $user->name]));
    }

    public function toggleDuty(array $data): ServiceResponseDTO
    {
        $guild = Guild::with('guildSettings')->findOrFail($data['guild_id']);

        if (! $guild->guildSettings->isEnabledFeature(FeatureEnum::DUTY)) {
            return $this->makeResponse(false, null, __('app.feature_not_enabled'), 400);
        }

        try {
            return DB::transaction(function () use ($guild, $data) {
                $guild_user = $guild->acceptedGuildUsers()->where('user_id', $data['user_id'])->firstOrFail();
                $result = [];
                $message = '';

                if ($data['action'] !== DutyActionEnum::CANCEL_DUTY->value) {
                    $result = $guild_user->duty();
                    $success = ! empty($result['duty_action']);
                    if ($success) {
                        ActivityLog::make($guild->id, $guild_user->user_id, null, ActionTypeEnum::from($result['duty_action']), $result['duty_model']->toArray());
                    }
                } else {
                    $result['duty_model'] = $guild_user->currentDuty()->firstOrFail();
                    $success = DeleteActiveDutyAction::run($result['duty_model'], ($data['forced_by'] ?? null));
                }

                switch ($data['action']) {
                    case DutyActionEnum::ON_DUTY->value:
                        $message = __('duty.success_duty_on');
                        break;
                    case DutyActionEnum::OFF_DUTY->value:
                        $message = __('duty.success_duty_off');
                        break;
                    case DutyActionEnum::CANCEL_DUTY->value:
                        if (! empty($data['forced_by'])) {
                            $message = __('duty.success_duty_forced_cancel', ['user' => $guild_user->user->name]);
                        } else {
                            $message = __('duty.success_duty_cancel');
                        }
                        break;
                }

                return $this->makeResponse($success, $result['duty_model'] ?? null, $message);
            });
        } catch (Throwable $e) {
            Log::error('Toggle duty hiba: '.$e->getMessage(), ['data' => $data]);

            return $this->makeResponse(false, null, __('app.error_action'), 400);
        }
    }
}
