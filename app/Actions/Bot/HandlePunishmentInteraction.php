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
            'removeverbal_warning' => $this->handleRemovePunishment($interaction, PunishmentTypeEnum::VERBAL_WARNING),
            'removewarn' => $this->handleRemovePunishment($interaction, PunishmentTypeEnum::WARNING),
            'removeblacklist' => $this->handleRemovePunishment($interaction, PunishmentTypeEnum::BLACKLIST),
            default => $this->respondSimpleEmbed($interaction, '❌ '.__('app.unknow_command'), 'FF0000'),
        };

    }

    protected function handleAddPunishment(DiscordInteraction $interaction, PunishmentTypeEnum $type): void
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

            if (! $this->validateAccess($interaction, $required_permission) && ! $this->validateAccess($interaction, PermissionEnum::ADD_PUNISHMENTS)) {
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

    protected function handleRemovePunishment(DiscordInteraction $interaction, PunishmentTypeEnum $type): void
    {
        try {
            switch ($type) {
                case PunishmentTypeEnum::VERBAL_WARNING:
                    $required_permission = PermissionEnum::DELETE_VERBAL_WARNING;
                    $title = __('punishment.success_delete_verbal_warning');
                    break;
                case PunishmentTypeEnum::WARNING:
                    $required_permission = PermissionEnum::DELETE_WARNING;
                    $title = __('punishment.success_delete_warning');
                    break;
                case PunishmentTypeEnum::BLACKLIST:
                    $required_permission = PermissionEnum::DELETE_BLACKLIST;
                    $title = __('punishment.success_delete_blacklist');
                    break;
                default:
                    $title = __('punishment.success_delete_punishment');
                    $required_permission = PermissionEnum::DELETE_PUNISHMENTS;
            }

            if (! $this->validateAccess($interaction, $required_permission) && ! $this->validateAccess($interaction, PermissionEnum::DELETE_PUNISHMENTS)) {
                return;
            }

            if (! $this->target_guild_user) {
                $this->respondSimpleEmbed($interaction, ('guild_user.error_not_found_user'), 'FF0000');
                return;
            }

            $level = $this->active_options->get('name', 'level')?->value ?? null;
            //$reason = $this->active_options->get('name', 'reason')?->value ?? null;

            $query = $this->target_guild_user->activePunishments();
            if ($level && $type !== PunishmentTypeEnum::BLACKLIST) {
                $query->where('level', $level);
            }
            $active_punishment = $query->first();

            if (! $active_punishment) {
                $this->respondSimpleEmbed($interaction, __('punishment.error_no_active_punishment'), 'FF0000');
                return;
            }

            $is_success = $this->service->delete($active_punishment, $this->user->id);

            if ($is_success) {
                $fields[] = $this->makeEmbedField(__('guild_user.user'), '<@'.$this->target_user_id.'>');
                $data = $this->buildEmbedData('⚠️ '.$title, '00FF00', '', $fields);
                $this->respondEphemeralEmbed($interaction, 'normal', $data);
            } else {
                $this->respondSimpleEmbed($interaction, '❌ '.__('app.error_action'), 'FF0000');
            }

        } catch (\Throwable $e) {
            Log::error('Hiba a büntetés törlésekor: '.$e->getMessage());
            $this->respondSimpleEmbed($interaction, '❌ '.__('app.error_action'), 'FF0000');
        }
    }
}
