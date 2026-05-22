<?php

namespace App\Actions\Bot;

use App\Concerns\DiscordCommandTrait;
use App\Concerns\DiscordEmbedTrait;
use App\Enums\FeatureEnum;
use App\Enums\PermissionEnum;
use App\Enums\PunishmentTypeEnum;
use App\Models\Punishment;
use App\Services\PunishmentService;
use Discord\Discord;
use Discord\Parts\Interactions\Interaction as DiscordInteraction;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Lorisleiva\Actions\Concerns\AsAction;

class HandlePunishmentInteraction
{
    use AsAction, DiscordCommandTrait, DiscordEmbedTrait;

    public function handle(Discord $discord, DiscordInteraction $interaction): void
    {
        $this->init($discord, $interaction, app(PunishmentService::class));
        if (! $this->validateFeature($interaction, FeatureEnum::WARN)) {
            return;
        }

        match ($this->sub_command_name) {
            'verbal_warning' => $this->handleAddPunishment($interaction, PunishmentTypeEnum::VERBAL_WARNING),
            'warn' => $this->handleAddPunishment($interaction, PunishmentTypeEnum::WARNING),
            'blacklist' => $this->handleAddPunishment($interaction, PunishmentTypeEnum::BLACKLIST),
            default => $this->respondSimpleEmbed($interaction, '❌ '.__('app.unknow_command'), 'FF0000'),
        };

    }

    private function handleAddPunishment(DiscordInteraction $interaction, PunishmentTypeEnum $type): void
    {
        try {
            switch ($type) {
                case PunishmentTypeEnum::VERBAL_WARNING:
                    $required_permission = PermissionEnum::ADD_VERBAL_WARNING;
                    $title = __('punishment.success_add_verbal_warning');
                    break;
                case PunishmentTypeEnum::WARNING:
                    $required_permission = PermissionEnum::ADD_WARNING;
                    $title = __('punishment.success_add_warning');
                    break;
                case PunishmentTypeEnum::BLACKLIST:
                    $required_permission = PermissionEnum::ADD_BLACKLIST;
                    $title = __('punishment.success_add_blacklist');
                    break;
                default:
                    $title = __('punishment.success_add_punishment');
                    $required_permission = PermissionEnum::ADD_PUNISHMENTS;
            }

            if (! $this->validateAccess($interaction, $required_permission) || ! $this->validateAccess($interaction, PermissionEnum::ADD_PUNISHMENTS)) {
                return;
            }

            $level = $this->active_options->get('name', 'level')?->value ?? null;
            $reason = $this->active_options->get('name', 'reason')?->value;

            $days = $this->active_options->get('name', 'days')?->value ?? null;
            $expires_at = (int) $days > 0 ? now()->addDays($days) : null;

            $punishment = DB::transaction(function () use ($type, $reason, $expires_at, $level) {
                return Punishment::make($this->target_guild_user, null, $this->guild, $type, $level, $reason, $expires_at, $this->user);
            });

            if ($punishment) {
                $fields[] = $this->makeEmbedField(__('guild_user.user'), '<@'.$this->target_user_id.'>');
                $data = $this->buildEmbedData('⚠️ '.$title, '00FF00', '', $fields);
                $this->respondEphemeralEmbed($interaction, 'normal', $data);
            } else {
                $this->respondSimpleEmbed($interaction, '❌ '.__('app.error_action'), 'FF0000');
            }

        } catch (\Throwable $e) {
            Log::error('Hiba a büntetés létrehozásakor: '.$e->getMessage());
            $this->respondSimpleEmbed($interaction, '❌ '.__('app.error_action'), 'FF0000');
        }
    }
}
