<?php

namespace App\Actions\Bot;

use App\Concerns\DiscordCommandTrait;
use App\Enums\DutyActionEnum;
use App\Enums\DutyStatusEnum;
use App\Enums\FeatureEnum;
use App\Enums\PermissionEnum;
use App\Services\DiscordFetchService;
use App\Services\DutyService;
use Lorisleiva\Actions\Concerns\AsAction;
use Discord\Parts\Interactions\Interaction as DiscordInteraction;
use const http\Client\Curl\FEATURES;

class HandleDutyInteraction
{
    use AsAction, DiscordCommandTrait;

    protected ?string $duty_role = null;

    /**
     * Execute the console command.
     */
    public function handle(DiscordInteraction $interaction): void
    {
        $this->init($interaction, app(DutyService::class));
        if (! $this->guild->guildSettings->isEnabledFeature(FeatureEnum::DUTY)) {
            $this->respondEphemeral($interaction, __('app.feature_not_enabled'));
            return;
        }
        $this->duty_role = $this->guild->guildSettings->getFeatureSettings(FeatureEnum::DUTY, 'duty_role_id', null);
        $command_name = $interaction->data->name;

        match ($command_name) {
            'duty' => $this->handleDutyCommand($interaction),
            default => null,
        };
    }

    public function handleDutyCommand(DiscordInteraction $interaction): void
    {
        $this->init($interaction, app(DutyService::class));
        if (! $this->hasPermission($interaction, PermissionEnum::TOGGLE_DUTY)) {
            return;
        }

        $result = $this->guild_user->duty();

        if ($result['duty_action'] === DutyActionEnum::ON_DUTY) {
            DiscordFetchService::addRoleToMember($this->guild->id, $this->user->id, $this->duty_role);
            $this->respondEphemeral($interaction, __('duty.success_duty_on'));
        } elseif ($result['duty_action'] === DutyActionEnum::OFF_DUTY) {
            $current_duties_sum = $this->guild_user->getDutiesValue();
            $all_duties_sum = $this->guild_user->getDutiesValue(DutyStatusEnum::ALL_PERIOD);
            DiscordFetchService::removeRoleFromMember($this->guild->id, $this->user->id, $this->duty_role);
            $this->respondEphemeral($interaction, __('duty.success_duty_off'));
        } else {
            $this->respondEphemeral($interaction, __('app.error_action'));
        }
    }
}
