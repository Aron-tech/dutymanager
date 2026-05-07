<?php

namespace App\Actions;

use App\Enums\DutyStatusEnum;
use App\Enums\FeatureEnum;
use App\Models\Duty;
use App\Models\GuildSettings;
use App\Models\GuildUser;
use App\Services\DiscordFetchService;
use App\Services\SelectedGuildService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Lorisleiva\Actions\Concerns\AsAction;
use function Symfony\Component\Translation\t;

class ChangeGuildUserRankAction
{
    use AsAction;

    /**
     * @param  string  $action  options: 'up' or 'down'
     *
     * @throws
     */
    public function handle(GuildUser $guild_user, ?GuildSettings $guild_settings, string $action = 'up', int $level = 1): bool
    {
        try {
            $guild_settings = $guild_settings ?: SelectedGuildService::get()?->guildSettings();

            if (! $guild_settings) {
                throw new \RuntimeException('Guild settings could not be determined.');
            }

            if (! $guild_settings->isEnabledFeature(FeatureEnum::RANK)) {
                throw new \Exception('Rank feature is not enabled for this guild.');
            }

            if (! in_array($action, ['up', 'down'])) {
                throw new \InvalidArgumentException('Action must be "up" or "down".');
            }

            $rank_roles = $guild_settings->getFeatureSettings(FeatureEnum::RANK, 'rank_roles', []);
            $rank_roles_count = count($rank_roles);
            $max_index = $rank_roles_count - 1;

            if ($rank_roles_count === 0) {
                throw new \Exception('No rank roles configured for this guild.');
            }

            $current_rank_data = $guild_user->getRankData($guild_settings);
            $current_index = $current_rank_data['index'] ?? -1;

            if ($action === 'up') {
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

            DB::transaction(function () use ($guild_user, $guild_settings) {
                $guild_user->rank_changed_at = now();
                $guild_user->save(['rank_changed_at']);

                if ($guild_settings->getFeatureSettings(FeatureEnum::RANK, 'archive_duties_on_promotion', false)) {
                    $guild_user->duties()->finishedDuties()->update(['status' => DutyStatusEnum::ALL_PERIOD]);
                }

            });

            DiscordFetchService::addRoleToMember($guild_user->guild_id, $guild_user->user_id, $rank_roles[$new_rank_index]);

            return true;

        } catch (\Throwable $e) {
            Log::error('Failed ');

            return false;
        }
    }
}
