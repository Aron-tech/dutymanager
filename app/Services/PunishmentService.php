<?php

namespace App\Services;

use App\Enums\ActionTypeEnum;
use App\Enums\PunishmentTypeEnum;
use App\Models\ActivityLog;
use App\Models\Punishment;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class PunishmentService
{
    public function create(array $data): Punishment
    {
        return DB::transaction(function () use ($data) {
            $guild = SelectedGuildService::get();
            $guild_user = $guild->guildUsers()->where('user_id', $data['user_id'])->first();
            $type_enum = PunishmentTypeEnum::from($data['type']);
            $expires_at = (int)$data['expire_days'] > 0 ? now()->addDays($data['expire_days']) : null;
            $created_by = auth()->user();

            $punishment = Punishment::make($guild_user, null, null, $type_enum, $data['level'], $data['reason'], $expires_at, $created_by);

            ActivityLog::make($guild->id, $created_by->id, $guild_user->user_id, ActionTypeEnum::ADD_PUNISHMENT_TO_GUILD_USER, $punishment->toArray());

            return $punishment;
        });

    }

    public function delete(Punishment $punishment): bool
    {
        $guild = SelectedGuildService::get();
        $punishment_id_array = [$punishment->id];

        return DB::transaction(function () use ($punishment, $punishment_id_array, $guild) {
            $is_deleted = $punishment->delete();

            ActivityLog::make($guild->id, auth()->id(), null, ActionTypeEnum::DELETE_PUNISHMENT_FROM_GUILD_USER, $punishment_id_array);
        });
    }

    /**
     * @return void
     */
    public function bulkDelete(array $punishment_ids)
    {
        $guild = SelectedGuildService::get();

        return DB::transaction(function () use ($punishment_ids, $guild) {
            $delete_count = Punishment::whereIn('id', $punishment_ids)->delete();

            ActivityLog::make($guild->id, auth()->id(), null, ActionTypeEnum::DELETE_PUNISHMENT_FROM_GUILD_USER, $punishment_ids);

            return $delete_count;
        });
    }
}
