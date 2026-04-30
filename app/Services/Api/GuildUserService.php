<?php

namespace App\Services\Api;

use App\Actions\DeleteActiveDutyAction;
use App\Actions\JoinUserToGuildAction;
use App\Concerns\ServiceTrait;
use App\DTO\ServiceResponseDTO;
use App\Enums\DutyActionEnum;
use App\Enums\FeatureEnum;
use App\Models\Guild;
use App\Models\GuildUser;
use App\Models\User;
use App\Services\DiscordFetchService;
use App\Services\SelectedGuildService;
use Illuminate\Support\Facades\Cache;
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

        $exists_guild_user = $guild->acceptedGuildUsers()->where('user_id', $data['user_id'])->exists();
        if ($exists_guild_user) {
            return $this->makeResponse(false, null, __('guild_user.already_exists_user', ['user' => $user->name]), 409);
        }

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
        $guild = SelectedGuildService::get();

        if (! $guild->guildSettings->isEnabledFeature(FeatureEnum::DUTY)) {
            return $this->makeResponse(false, null, __('app.feature_not_enabled'), 400);
        }

        try {
            return DB::transaction(function () use ($guild, $data) {
                $guild_user = $guild->acceptedGuildUsers()->where('user_id', $data['user_id'])->firstOrFail();
                $result = [];
                $message = '';

                if ($data['duty_action'] !== DutyActionEnum::CANCEL_DUTY->value) {
                    $result = $guild_user->duty();
                    $success = ! empty($result['duty_action']);
                    if ($success) {
                        $result['duty_action'] = $result['duty_action']->value;
                    }
                } else {
                    $result['duty_model'] = $guild_user->currentDuty()->firstOrFail();
                    $result['duty_action'] = DutyActionEnum::CANCEL_DUTY->value;
                    $success = DeleteActiveDutyAction::run($result['duty_model'], ($data['forced_by'] ?? null));
                }

                $duty_role = null;
                if ($success) {
                    $duty_role = $guild->guildSettings->getFeatureSettings(FeatureEnum::DUTY, 'duty_role_id');
                }

                switch ($result['duty_action']) {
                    case DutyActionEnum::ON_DUTY->value:
                        if ($duty_role) {
                            DiscordFetchService::addRoleToMember($guild->id, $guild_user->user_id, $duty_role);
                        }
                        $message = __('duty.success_duty_on');
                        break;
                    case DutyActionEnum::OFF_DUTY->value:
                        if ($duty_role) {
                            DiscordFetchService::removeRoleFromMember($guild->id, $guild_user->user_id, $duty_role);
                        }
                        $message = __('duty.success_duty_off');
                        break;
                    case DutyActionEnum::CANCEL_DUTY->value:
                        if ($duty_role) {
                            DiscordFetchService::removeRoleFromMember($guild->id, $guild_user->user_id, $duty_role);
                        }
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

    /**
     * @param Guild $guild
     * @param array $data
     * @return ServiceResponseDTO
     * @throws Throwable
     */
    public function updateRoles(Guild $guild, array $data): ServiceResponseDTO
    {
        DB::beginTransaction();

        try {
            Log::info($data['role_ids']);
            $updated = GuildUser::where('guild_id', $guild->id)->where('user_id', $data['user_id'])->accepted()->update(['cached_roles' => $data['role_ids']]);

            if ($updated < 1) {
                DB::rollBack();

                return $this->makeResponse(false, null, __('app.error_action'), 400);
            }

            Cache::forget("guild_{$guild->id}_user_{$data['user_id']}_permissions");

            DB::commit();

            return $this->makeResponse(true, null, __('app.success_action'));

        } catch (Throwable $e) {
            DB::rollBack();

            Log::error('Hiba a rangok frissítésekor: '.$e->getMessage(), [
                'guild_id' => $guild->id ?? null,
                'user_id' => $data['user_id'] ?? null,
                'exception' => $e,
            ]);

            return $this->makeResponse(false, null, __('app.error_action'), 400);
        }
    }
}
