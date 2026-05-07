<?php

namespace App\Actions;

use App\Enums\ActionTypeEnum;
use App\Enums\DutyStatusEnum;
use App\Enums\FeatureEnum;
use App\Models\ActivityLog;
use App\Models\GuildSettings;
use App\Models\GuildUser;
use App\Services\DiscordFetchService;
use App\Services\SelectedGuildService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Lorisleiva\Actions\Concerns\AsAction;

class ChangeGuildUserRankAction
{
    use AsAction;

    /**
     * @param  string  $action  options: 'promote' or 'demote'
     *
     * @throws
     */
    public function handle(GuildUser $guild_user, ?GuildSettings $guild_settings, string $action = 'promote', int $level = 1): bool
    {
        try {
            $guild_settings = $guild_settings ?: SelectedGuildService::get()?->guildSettings() ?: $guild_user->guild()?->guildSettings;

            if (! $guild_settings) {
                throw new \RuntimeException('Guild settings could not be determined.');
            }

            if (! $guild_settings->isEnabledFeature(FeatureEnum::RANK)) {
                throw new \Exception('Rank feature is not enabled for this guild.');
            }

            if (! in_array($action, ['promote', 'demote'])) {
                throw new \InvalidArgumentException('Action must be "promote" or "demote".');
            }

            $rank_roles = $guild_settings->getFeatureSettings(FeatureEnum::RANK, 'rank_roles', []);
            $rank_roles_count = count($rank_roles);
            $max_index = $rank_roles_count - 1;

            if ($rank_roles_count === 0) {
                throw new \Exception('No rank roles configured for this guild.');
            }

            $current_rank_data = $guild_user->getRankData($guild_settings);
            $current_index = $current_rank_data['index'] ?? -1;

            if ($action === 'promote') {
                $new_rank_index = $current_index + $level;
                if ($new_rank_index > $max_index) {
                    $new_rank_index = $max_index;
                }
            } else {
                $new_rank_index = $current_index - $level;
                if ($new_rank_index < 0) {
                    $new_rank_index = 0;
                }
            }

            $archive_duties_on_promotion = $guild_settings->getFeatureSettings(FeatureEnum::RANK, 'archive_duties_on_promotion', false);

            $rank_history = ['old_rank_id' => $current_rank_data['rank_id'], 'current_rank_id' => $rank_roles[$new_rank_index]];

            DB::transaction(function () use ($guild_user, $action, $archive_duties_on_promotion, $rank_history) {
                $guild_user->rank_changed_at = now();
                $guild_user->save(['rank_changed_at']);

                if ($archive_duties_on_promotion) {
                    $guild_user->duties()->finishedDuties()->update(['status' => DutyStatusEnum::ALL_PERIOD]);
                }

                $this->makeLog($guild_user, $action, $archive_duties_on_promotion, $rank_history);
            });

            DiscordFetchService::removeRoleFromMember($guild_user->guild_id, $guild_user->user_id, $current_rank_data['rank_id']);
            DiscordFetchService::addRoleToMember($guild_user->guild_id, $guild_user->user_id, $rank_roles[$new_rank_index]);

            return true;

        } catch (\Throwable $e) {
            Log::error('Failed ');

            return false;
        }
    }

    private function makeLog(GuildUser $guild_user, string $action, bool $archive_duties_on_promotion, array $rank_history): void
    {
        if ($action === 'promote') {
            if ($archive_duties_on_promotion) {
                $action_enum = ActionTypeEnum::RANK_UP_WITH_RESET_GUILD_USER;
            } else {
                $action_enum = ActionTypeEnum::RANK_UP_GUILD_USER;
            }
        } else {
            if ($archive_duties_on_promotion) {
                $action_enum = ActionTypeEnum::RANK_DOWN_WITH_RESET_GUILD_USER;
            } else {
                $action_enum = ActionTypeEnum::RANK_DOWN_GUILD_USER;
            }
        }

        ActivityLog::make($guild_user->guild_id, auth()->id(), $guild_user->user_id, $action_enum, $rank_history);
    }
}
