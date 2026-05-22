<?php

namespace App\Actions\Bot;

use App\Concerns\DiscordCommandTrait;
use App\Concerns\DiscordEmbedTrait;
use App\Enums\DutyStatusEnum;
use App\Enums\FeatureEnum;
use App\Enums\PermissionEnum;
use App\Models\Duty;
use App\Models\GuildUser;
use App\Services\GuildUserService;
use Discord\Discord;
use Discord\Parts\Interactions\Interaction as DiscordInteraction;
use Illuminate\Support\Facades\Log;
use Lorisleiva\Actions\Concerns\AsAction;

class HandleGuildUserInteraction
{
    use AsAction, DiscordCommandTrait, DiscordEmbedTrait;

    /**
     * Execute the console command.
     */
    public function handle(Discord $discord, DiscordInteraction $interaction): void
    {
        $this->init($discord, $interaction, app(GuildUserService::class));
        if (! $this->validateGuild($interaction)) {
            return;
        }
        if (empty($this->sub_command_name)) {
            match ($this->command_name) {
                'info' => $this->handleUserInfoCommand($interaction, $this->guild_user),
                default => $this->respondSimpleEmbed($interaction, '❌ '.__('app.unknow_command'), 'FF0000'),
            };
        } else {
            match ($this->sub_command_name) {
                'info' => $this->handleUserInfoCommand($interaction, $this->target_guild_user, $this->target_user_id, true),
                default => $this->respondSimpleEmbed($interaction, '❌ '.__('app.unknow_command'), 'FF0000'),
            };
        }
    }

    protected function handleUserInfoCommand(DiscordInteraction $interaction, ?GuildUser $guild_user, ?string $user_id = null, bool $is_admin = false): void
    {
        try {
            $required_permission = $is_admin ? PermissionEnum::VIEW_GUILD_USERS : PermissionEnum::GET_USER_INFO;

            if (! $this->validateAccess($interaction, $required_permission)) {
                return;
            }

            $guild_user ??= ($user_id ? $this->guild->acceptedGuildUsers()->where('user_id', $user_id)->first() : null);

            if (! $guild_user) {
                $this->respondSimpleEmbed($interaction, '❌ '.__('app.error_not_found_user'), 'FF0000');

                return;
            }

            $current_duties_sum = $guild_user->getDutiesValue();
            $all_duties_sum = $guild_user->getDutiesValue(DutyStatusEnum::ALL_PERIOD);
            $last_punishment = $this->guild->guildSettings->isEnabledFeature(FeatureEnum::WARN) ? $guild_user->punishments()->latest()->first(['guild_user_id', 'expires_at', 'type']) : null;
            $fields[] = $this->makeEmbedField('🪪 '.__('guild_user.user'), '<@'.$guild_user->user_id.'>', false);
            $fields[] = $this->makeEmbedField('👤 '.__('guild_user.ic_name'), $guild_user->ic_name, false);
            foreach ($guild_user->details as $key => $value) {
                $fields[] = $this->makeEmbedField($key, $value, false);
            }
            $fields[] = $this->makeEmbedField('🕒 '.__('duty.current_duties_sum'), Duty::standardFormat($current_duties_sum), false);
            $fields[] = $this->makeEmbedField('⏱️ '.__('duty.all_duties_sum'), Duty::standardFormat($all_duties_sum), false);
            $fields[] = $this->makeEmbedField('📅 '.__('guild_user.user_in_rank'), $guild_user->rank_changed_ago, false);
            if ($last_punishment) {
                $fields[] = $this->makeEmbedField('⚠️ '.__('guild_user.last_punishment_expires_at', ['punishment_type' => strtolower($last_punishment->type->getLabel())]), $last_punishment->expires_at, false);
            }
            $fields[] = $this->makeEmbedField('📅 '.__('guild_user.user_in_faction'), $guild_user->joined_ago, false);
            $fields[] = $this->makeEmbedField('📅 '.__('guild_user.accepted_at'), $guild_user->accepted_at, false);
            $data = $this->buildEmbedData(__('guild_user.user_info_command_title'), '0000FF', '', $fields);
            $this->respondEphemeralEmbed($interaction, 'normal', $data);
        } catch (\Throwable $e) {
            Log::error('Hiba a user info lekérésekor: '.$e->getMessage(), ['user_id' => $guild_user?->user_id, 'exception' => $e]);

            $this->respondSimpleEmbed($interaction, '❌ '.__('app.error_action'), 'FF0000');
        }
    }
}
