<?php

namespace App\Actions;

use App\Enums\ActionTypeEnum;
use App\Enums\FeatureEnum;
use App\Models\ActivityLog;
use App\Models\Duty;
use App\Models\GuildSettings;
use App\Models\GuildUser;
use App\Services\DiscordFetchService;
use Lorisleiva\Actions\Concerns\AsAction;

class DeleteActiveDutyAction
{
    use AsAction;

    public function handle(Duty $duty, ?string $user_id = null): bool
    {
        if (is_null($duty->value) && is_null($duty->finished_at)) {
            $guild_user = GuildUser::where('guild_id', $duty->guild_id)->where('user_id', $duty->user_id)->first();
            if ($guild_user) {
                $guild_settings = GuildSettings::where('guild_id', $guild_user->guild_id)->select(['guild_id', 'features', 'feature_settings'])->first();
                if ($guild_settings) {
                    $duty_role = $guild_settings->getFeatureSettings(FeatureEnum::DUTY, 'duty_role_id');
                    DiscordFetchService::removeRoleFromMember($guild_user->guild_id, $guild_user->user_id, $duty_role);
                    ActivityLog::make($duty->guild_id, $user_id, $duty->user_id, ActionTypeEnum::CANCELED_DUTY_FROM_GUILD_USER, $duty->toArray());

                    return true;
                }
            }
        }

        return false;
    }
}
