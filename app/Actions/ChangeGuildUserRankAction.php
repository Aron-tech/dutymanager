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
use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use InvalidArgumentException;
use Lorisleiva\Actions\Concerns\AsAction;
use RuntimeException;
use Throwable;

class ChangeGuildUserRankAction
{
    use AsAction;

    /**
     * @param  string  $action  options: 'promote' or 'demote'
     *
     * @throws Exception
     * @throws InvalidArgumentException
     * @throws RuntimeException
     */
    public function handle(GuildUser $guild_user, ?GuildSettings $guild_settings, string $action = 'promote', int $level = 1, ?int $causer_id = null): bool
    {
        try {
            $guild_settings = $guild_settings ?: SelectedGuildService::get()?->guildSettings ?: $guild_user->guild?->guildSettings;
            $auth_id = $causer_id ?: auth()->id();

            if (! $guild_settings) {
                throw new RuntimeException('Guild settings could not be determined.');
            }

            if (! $guild_settings->isEnabledFeature(FeatureEnum::RANK)) {
                throw new Exception('Rank feature is not enabled for this guild.');
            }

            if (! in_array($action, ['promote', 'demote'])) {
                throw new InvalidArgumentException('Action must be "promote" or "demote".');
            }

            $rank_roles = $guild_settings->getFeatureSettings(FeatureEnum::RANK, 'rank_roles', []);
            $rank_roles_count = count($rank_roles);
            $max_index = $rank_roles_count - 1;

            if ($rank_roles_count === 0) {
                throw new Exception('No rank roles configured for this guild.');
            }

            $current_rank_data = $guild_user->getRankData($guild_settings);
            $current_index = $current_rank_data['index'] ?? -1;
            $old_rank_id = $current_rank_data['rank_id'] ?? null;

            $new_rank_index = $action === 'promote'
                ? min($current_index + $level, $max_index)
                : max($current_index - $level, 0);

            if ($current_index === $new_rank_index) {
                return true;
            }

            $archive_duties_on_promotion = $guild_settings->getFeatureSettings(FeatureEnum::RANK, 'archive_duties_on_promotion', false);

            $rank_history = ['old_rank_id' => $old_rank_id, 'current_rank_id' => $rank_roles[$new_rank_index]];

            DB::transaction(function () use ($guild_user, $action, $archive_duties_on_promotion, $rank_history, $auth_id) {
                $guild_user->rank_changed_at = now();
                $guild_user->save();

                if ($archive_duties_on_promotion) {
                    $guild_user->duties()->finishedDuties()->update(['status' => DutyStatusEnum::ALL_PERIOD]);
                }

                $this->makeLog($guild_user, $action, $archive_duties_on_promotion, $rank_history, $auth_id);
            });

            if ($old_rank_id) {
                DiscordFetchService::removeRoleFromMember($guild_user->guild_id, $guild_user->user_id, $old_rank_id);
            }
            DiscordFetchService::addRoleToMember($guild_user->guild_id, $guild_user->user_id, $rank_roles[$new_rank_index]);

            return true;

        } catch (Throwable $e) {
            Log::error('Failed to change rank for user.', [
                'guild_user_id' => $guild_user->id,
                'action' => $action,
                'exception' => $e,
            ]);

            return false;
        }
    }

    private function makeLog(GuildUser $guild_user, string $action, bool $archive_duties_on_promotion, array $rank_history, int $auth_id): void
    {
        $action_enum = match ($action) {
            'promote' => $archive_duties_on_promotion ? ActionTypeEnum::RANK_UP_WITH_RESET_GUILD_USER : ActionTypeEnum::RANK_UP_GUILD_USER,
            'demote' => $archive_duties_on_promotion ? ActionTypeEnum::RANK_DOWN_WITH_RESET_GUILD_USER : ActionTypeEnum::RANK_DOWN_GUILD_USER,
        };

        ActivityLog::make($guild_user->guild_id, $auth_id, $guild_user->user_id, $action_enum, $rank_history);
    }
}
