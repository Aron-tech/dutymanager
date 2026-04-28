<?php

namespace App\Services\Api;

use App\Concerns\ServiceTrait;
use App\Enums\ActionTypeEnum;
use App\Enums\PermissionEnum;
use App\Models\ActivityLog;
use App\Models\Guild;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

class GuildService
{
    use ServiceTrait;

    /**
     * @throws Throwable
     */
    public function addBotToGuild(array $data): Guild
    {
        DB::beginTransaction();

        try {
            $guild = Guild::createOrRestore(
                ['id' => $data['id']],
                [
                    'name' => $data['name'],
                    'owner_id' => $data['owner_id'],
                    'lang_code' => $data['lang_code'],
                ]
            );

            ActivityLog::make($guild->id, null, null, ActionTypeEnum::ADD_BOT_TO_GUILD, $data);

            DB::commit();

            return $guild;

        } catch (Throwable $exception) {
            DB::rollBack();
            Log::error('Sikertelen bot hozzáadás: '.$exception->getMessage());
            throw $exception;
        }
    }

    public function getGuildSettings(array $data)
    {
        $guild = Guild::find($data['guild_id']);

        $guild->load(['guildSettings']);

        return $guild->guildSettings->getFeatureSettings(PermissionEnum::from($data['feature']), $data['settings_name']);
    }

    public function listRoleWhitelist(Guild $guild): array
    {
        $guild_role_ids = [];
        foreach ($guild->guildRoles as $role) {
            $guild_role_ids[] = $role->role_id;
        }

        $all_role_ids = array_merge($guild_role_ids);

        return $all_role_ids;
    }
}
