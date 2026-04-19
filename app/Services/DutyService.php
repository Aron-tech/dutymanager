<?php

namespace App\Services;

use App\Concerns\ServiceTrait;
use App\Enums\ActionTypeEnum;
use App\Enums\DutyStatusEnum;
use App\Models\ActivityLog;
use App\Models\Duty;
use App\Models\GuildUser;
use Illuminate\Support\Facades\DB;
use Throwable;

class DutyService
{
    use ServiceTrait;

    private ?Duty $duty = null;

    public function loadModel(?Duty $duty, ?int $duty_id): void
    {
        $this->duty = $duty ?? Duty::findOrFail($duty_id);
    }

    public function storeDuty(array $data): Duty
    {
        return DB::transaction(function () use ($data) {
            $guild_user = GuildUser::findOrFail($data['guild_user_id']);
            $duty = $guild_user->duties()->create([
                ...$data,
                'started_at' => time(),
                'finished_at' => time(),
            ]);

            ActivityLog::make($guild_user->guild_id, auth()->id(), $guild_user->user_id, ActionTypeEnum::ADD_DUTY_TO_GUILD_USER, $duty->toArray());

            return $duty;
        });
    }

    public function updateDutiesStatus(array $duty_ids, DutyStatusEnum $status): void
    {
        DB::transaction(function () use ($duty_ids, $status) {
            Duty::whereIn('id', $duty_ids)->update(['status' => $status]);
        });
    }

    /**
     * @param array $duty_ids
     * @param DutyStatusEnum $status
     * @return void
     * @throws Throwable
     */
    public function deleteDuties(array $duty_ids, DutyStatusEnum $status = DutyStatusEnum::ALL_PERIOD): void
    {
        DB::transaction(function () use ($duty_ids, $status) {
            Duty::whereIn('id', $duty_ids)->where('status', '<=', $status)->delete();
        });
    }
}
