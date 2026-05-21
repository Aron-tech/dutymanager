<?php

namespace App\Actions\Bot;

use App\Actions\DeleteActiveDutyAction;
use App\Concerns\DiscordCommandTrait;
use App\Concerns\DiscordEmbedTrait;
use App\Enums\DutyActionEnum;
use App\Enums\FeatureEnum;
use App\Enums\PermissionEnum;
use App\Models\Duty;
use App\Models\GuildUser;
use App\Services\DiscordFetchService;
use App\Services\DutyService;
use Discord\Discord;
use Discord\Parts\Interactions\Interaction as DiscordInteraction;
use Illuminate\Support\Facades\DB;
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
        if (! $this->validateFeature($interaction, FeatureEnum::DUTY)) {
            return;
        }
        $this->duty_role = $this->guild->guildSettings->getFeatureSettings(FeatureEnum::DUTY, 'duty_role_id', null);

        match ($this->sub_command_name) {
            'toggle' => $this->handleDutyCommand($interaction),
            'cancel' => $this->handleDutyCancelCommand($interaction),
            'fcancel' => $this->handleDutyForceCancelCommand($interaction),
            default => $this->respondSimpleEmbed($interaction, '❌ '.__('app.unknow_command'), 'FF0000'),
        };
    }

    public function handleDutyCommand(DiscordInteraction $interaction): void
    {
        if (! $this->hasPermission($interaction, PermissionEnum::TOGGLE_DUTY)) {
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
            $this->respondSimpleEmbed($interaction, '❌ '.__('app.error_action'), 'FF0000');
        }
    }

    public function handleDutyCancelCommand(DiscordInteraction $interaction): void
    {
        try {
            if (! $this->hasPermission($interaction, PermissionEnum::TOGGLE_DUTY)) {
                return;
            }

            $this->cancelDuty($interaction, $this->guild_user);

        } catch (\Throwable $e) {
            \Log::error('Hiba a duty törlésekor: '.$e->getMessage());
            $this->respondSimpleEmbed($interaction, '❌ '.__('app.error_action'), 'FF0000');
        }
    }

    public function handleDutyForceCancelCommand(DiscordInteraction $interaction): void
    {
        try {
            if (! $this->hasPermission($interaction, PermissionEnum::FORCE_CANCEL_DUTIES)) {
                return;
            }

            if (! $this->target_guild_user) {
                $this->respondSimpleEmbed($interaction, '❌ '.__('app.error_not_found_user'), 'FF0000');
                return;
            }

            $this->cancelDuty($interaction, $this->target_guild_user);

        } catch (\Throwable $e) {
            \Log::error('Hiba a duty törlésekor: '.$e->getMessage());
            $this->respondSimpleEmbed($interaction, '❌ '.__('app.error_action'), 'FF0000');
        }
    }

    private function cancelDuty(DiscordInteraction $interaction, GuildUser $guild_user): void
    {
        $active_duty = $guild_user->currentDuty()->first();

        if (! $active_duty) {
            $this->respondSimpleEmbed($interaction, __('🚨 '.'duty.not_on_duty'), 'FF0000');

            return;
        }

        DB::transaction(function () use ($active_duty) {
            if (DeleteActiveDutyAction::run($active_duty, $this->user->id, $this->guild_user, $this->guild->guildSettings)) {
                $active_duty->delete();
            } else {
                throw new \Exception('Duty deletion failed logic.');
            }
        });

        $this->respondEphemeralEmbed($interaction, 'normal', $this->buildEmbedData('🚨 '.__('duty.success_duty_cancel'), '00FF00', ''));
    }
}
