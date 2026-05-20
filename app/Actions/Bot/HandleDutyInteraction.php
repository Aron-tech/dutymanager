<?php

namespace App\Actions\Bot;

use App\Actions\DeleteActiveDutyAction;
use App\Concerns\DiscordCommandTrait;
use App\Concerns\DiscordEmbedTrait;
use App\Enums\DutyActionEnum;
use App\Enums\FeatureEnum;
use App\Enums\PermissionEnum;
use App\Models\Duty;
use App\Services\DiscordFetchService;
use App\Services\DutyService;
use Discord\Discord;
use Discord\Parts\Interactions\Interaction as DiscordInteraction;
use Lorisleiva\Actions\Concerns\AsAction;

class HandleDutyInteraction
{
    use AsAction, DiscordCommandTrait, DiscordEmbedTrait;

    protected ?string $duty_role = null;

    /**
     * Execute the console command.
     */
    public function handle(Discord $discord, DiscordInteraction $interaction): void
    {
        $this->init($discord, $interaction, app(DutyService::class));
        if (! $this->guild->guildSettings->isEnabledFeature(FeatureEnum::DUTY)) {
            $this->respondSimpleEmbed($interaction, __('app.feature_not_enabled'), 'FF0000');

            return;
        }
        $this->duty_role = $this->guild->guildSettings->getFeatureSettings(FeatureEnum::DUTY, 'duty_role_id', null);
        $command_name = $interaction->data->name;

        match ($command_name) {
            'duty' => $this->handleDutyCommand($interaction),
            'duty-cancel' => $this->handleDutyCancelCommand($interaction),
            default => null,
        };
    }

    public function handleDutyCommand(DiscordInteraction $interaction): void
    {
        if (! $this->hasPermission($interaction, PermissionEnum::TOGGLE_DUTY)) {
            $this->respondSimpleEmbed($interaction, __('app.error_no_permission'), 'FF0000');

            return;
        }

        $result = $this->guild_user->duty();

        if ($result['duty_action'] === DutyActionEnum::ON_DUTY) {
            DiscordFetchService::addRoleToMember($this->guild->id, $this->user->id, $this->duty_role);
            $this->respondSimpleEmbed($interaction, '🚨 '.__('duty.success_duty_on'), '00FF00');
        } elseif ($result['duty_action'] === DutyActionEnum::OFF_DUTY) {
            $current_duties_sum = $this->guild_user->getDutiesValue();
            DiscordFetchService::removeRoleFromMember($this->guild->id, $this->user->id, $this->duty_role);
            $fields[] = $this->makeEmbedField('🕒 '.__('duty.duty_value'), Duty::standardFormat($result['duty_model']->value), false);
            $fields[] = $this->makeEmbedField('⏱️ '.__('duty.current_duties_sum'), Duty::standardFormat($current_duties_sum), false);
            $fields[] = $this->makeEmbedField('📅 '.__('guild_user.in_your_rank'), $this->guild_user->rank_changed_ago, false);
            $data = $this->buildEmbedData('🚨 '.__('duty.success_duty_off'), 'FF0000', fields: $fields);
            $this->respondEphemeralEmbed($interaction, 'normal', $data);
        } else {
            $this->respondSimpleEmbed($interaction, __('app.error_action'), 'FF0000');
        }
    }

    public function handleDutyCancelCommand(DiscordInteraction $interaction): void
    {
        if (! $this->hasPermission($interaction, PermissionEnum::TOGGLE_DUTY)) {
            $this->respondSimpleEmbed($interaction, __('app.error_no_permission'), 'FF0000');
            return;
        }

        $active_duty = $this->guild_user->currentDuty()->first();

        if (empty($active_duty) || (! DeleteActiveDutyAction::run($active_duty, null, $this->guild_user, $this->guild->guildSettings))) {
            $this->respondSimpleEmbed($interaction, __('duty.not_on_duty'), 'FF0000');
            return;
        }

        $this->respondEphemeralEmbed($interaction, 'normal', $this->buildEmbedData(__('duty.success_duty_cancel'), '00FF00'));
    }
}
