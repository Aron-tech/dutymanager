<?php

namespace App\Actions\Bot;

use App\Concerns\DiscordCommandTrait;
use App\Concerns\DiscordEmbedTrait;
use App\Enums\FeatureEnum;
use App\Enums\PermissionEnum;
use App\Models\GuildUser;
use App\Models\Holiday;
use App\Services\HolidayService;
use Discord\Discord;
use Discord\Parts\Interactions\Interaction as DiscordInteraction;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Lorisleiva\Actions\Concerns\AsAction;

class HandleHolidayInteraction
{
    use AsAction, DiscordCommandTrait, DiscordEmbedTrait;

    public function handle(Discord $discord, DiscordInteraction $interaction): void
    {
        $this->init($discord, $interaction, app(HolidayService::class));
        if (! $this->validateFeature($interaction, FeatureEnum::HOLIDAY)) {
            return;
        }

        match ($this->sub_command_name) {
            'start' => $this->handleHolidayStart($interaction),
            'cancel' => $this->handleHolidayCancelCommand($interaction, $this->guild_user),
            'fcancel' => $this->handleHolidayCancelCommand($interaction, $this->target_guild_user, true),
            default => $this->respondSimpleEmbed($interaction, '❌ '.__('app.unknow_command'), 'FF0000'),
        };
    }

    protected function handleHolidayStart(DiscordInteraction $interaction): void
    {
        try {
            if (! $this->validateAccess($interaction, PermissionEnum::GET_HOLIDAY)) {
                return;
            }

            $duration_in_days = $this->active_options->get('name', 'days')?->value;
            $start_delay_in_days = $this->active_options->get('name', 'delay_days')?->value ?? 0;
            $reason = $this->active_options->get('name', 'reason')?->value;

            $holiday = DB::transaction(function () use ($duration_in_days, $start_delay_in_days, $reason) {
                return Holiday::make($this->guild_user, $reason, $duration_in_days, $start_delay_in_days);
            });

            if ($holiday) {
                $this->respondSimpleEmbed($interaction, __('holiday.success_get_holiday', ['days' => $duration_in_days]), '00FF00');
            } else {
                $this->respondSimpleEmbed($interaction, '❌ '.__('app.error_action'), 'FF0000');
            }

        } catch (\Throwable $e) {
            Log::error('Hiba a szabadság megkezdésekor: '.$e->getMessage(), ['user_id' => $this->user?->id, 'exception' => $e]);

            $this->respondSimpleEmbed($interaction, '❌ '.__('app.error_action'), 'FF0000');
        }
    }

    protected function handleHolidayCancelCommand(DiscordInteraction $interaction, ?GuildUser $guild_user, bool $is_admin = false): void
    {
        try {
            $required_permission = $is_admin ? PermissionEnum::FORCE_CANCEL_DUTIES : PermissionEnum::CANCEL_HOLIDAY;

            if (! $this->validateAccess($interaction, $required_permission)) {
                return;
            }

            if (! $guild_user) {
                $this->respondSimpleEmbed($interaction, __('guild_user.error_not_found_user'));

                return;
            }

            $active_holiday = $guild_user->activeHoliday()->first();

            if (! $active_holiday) {
                $this->respondSimpleEmbed($interaction, __('holiday.error_no_active_holiday'), 'FF0000');

                return;
            }

            $is_success = $this->service->delete($active_holiday, $this->guild, $this->user?->id);
            if ($is_admin && $is_success) {
                $fields[] = $this->makeEmbedField(__('guild_user.user'), '<@'.$active_holiday->user_id.'>');
                $data = $this->buildEmbedData(__('holiday.success_force_cancel'), '00FF00', '', $fields);
                $this->respondEphemeralEmbed($interaction, 'normal', $data);
            } elseif ($is_success) {
                $this->respondSimpleEmbed($interaction, '✅ '.__('holiday.success_cancel_holiday'), '00FF00');
            } else {
                $this->respondSimpleEmbed($interaction, '❌ '.__('app.error_action'), 'FF0000');
            }

        } catch (\Throwable $e) {
            Log::error('Hiba a szabadság megszakításakor: '.$e->getMessage(), ['user_id' => $this->user?->id, 'exception' => $e]);

            $this->respondSimpleEmbed($interaction, '❌ '.__('app.error_action'), 'FF0000');
        }
    }
}
