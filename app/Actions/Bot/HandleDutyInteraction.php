<?php

namespace App\Actions\Bot;

use App\Actions\DeleteActiveDutyAction;
use App\Concerns\DiscordCommandTrait;
use App\Concerns\DiscordEmbedTrait;
use App\Enums\ActionTypeEnum;
use App\Enums\DutyActionEnum;
use App\Enums\DutyStatusEnum;
use App\Enums\FeatureEnum;
use App\Enums\PermissionEnum;
use App\Models\ActivityLog;
use App\Models\Duty;
use App\Models\GuildUser;
use App\Services\DiscordFetchService;
use App\Services\DutyService;
use Discord\Discord;
use Discord\Parts\Interactions\Interaction as DiscordInteraction;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
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
            'toggle' => $this->handleDutyToggleCommand($interaction),
            'cancel' => $this->handleCancelCommand($interaction, $this->guild_user),
            'fcancel' => $this->handleCancelCommand($interaction, $this->target_guild_user, true),
            'toplist' => $this->handleDutyToplistCommand($interaction),
            'add' => $this->handleAddOrRemoveDutyCommand($interaction),
            'remove' => $this->handleAddOrRemoveDutyCommand($interaction, true),
            'delete' => $this->handleDutyDeleteCommand($interaction),
            'reset' => $this->handleDutyResetCommand($interaction),
            'clear' => $this->handleDutyClearCommand($interaction),
            default => $this->respondSimpleEmbed($interaction, '❌ '.__('app.unknow_command'), 'FF0000'),
        };
    }

    public function handleDutyToggleCommand(DiscordInteraction $interaction): void
    {
        if (! $this->validateAccess($interaction, PermissionEnum::TOGGLE_DUTY)) {
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
            $fields[] = $this->makeEmbedField('📅 '.__('guild_user.user_in_rank'), $this->guild_user->rank_changed_ago, false);
            $data = $this->buildEmbedData('🚨 '.__('duty.success_duty_off'), 'FF0000', fields: $fields);
            $this->respondEphemeralEmbed($interaction, 'normal', $data);
        } else {
            $this->respondSimpleEmbed($interaction, '❌ '.__('app.error_action'), 'FF0000');
        }
    }

    public function handleDutyToplistCommand(DiscordInteraction $interaction): void
    {
        try {
            if (! $this->validateAccess($interaction)) {
                return;
            }

            $limit = $this->active_options->get('name', 'limit')?->value ?? 10;
            $limit = max(1, min((int) $limit, 50));

            $order_by = $this->active_options->get('name', 'order_by')?->value ?? 'current_period_sum';

            $users_with_duties = $this->guild->acceptedGuildUsers()
                ->select(['id', 'guild_id', 'user_id', 'ic_name'])
                ->withSum(['duties as current_period_sum' => function ($query) {
                    $query->where('status', '<=', DutyStatusEnum::CURRENT_PERIOD);
                }], 'value')
                ->withSum(['duties as all_period_sum' => function ($query) {
                    $query->where('status', '<=', DutyStatusEnum::ALL_PERIOD);
                }], 'value')
                ->orderByDesc($order_by)
                ->limit($limit)
                ->get();

            $description = '';
            $rank = 1;

            foreach ($users_with_duties as $user) {
                $discord_user = "<@{$user->user_id}>";
                $ic_name = $user->ic_name;

                $current = Duty::standardFormat($user->current_period_sum ?? 0);
                $total = Duty::standardFormat($user->all_period_sum ?? 0);

                $description .= "**{$rank}.** {$discord_user} ({$ic_name})\n";
                $description .= '└ '.__('duty.current_duties_sum').": **{$current}** | ".__('duty.all_duties_sum').": **{$total}**\n\n";

                $rank++;
            }

            if (empty($description)) {
                $description = __('app.no_data');
            }

            $data = $this->buildEmbedData('📊 '.__('duty.duty_toplist_command_title'), '0000FF', $description);
            $this->respondEphemeralEmbed($interaction, 'normal', $data);

        } catch (\Throwable $e) {
            Log::error('Hiba a duty toplista lekérdezésekor: '.$e->getMessage());
            $this->respondSimpleEmbed($interaction, '❌ '.__('app.error_action'), 'FF0000');
        }
    }

    public function handleAddOrRemoveDutyCommand(DiscordInteraction $interaction, bool $is_remove = false): void
    {
        try {
            if (! $this->validateAccess($interaction, PermissionEnum::ADD_DUTIES)) {
                return;
            }

            if (! $this->target_guild_user) {
                $this->respondSimpleEmbed($interaction, '❌ '.__('app.error_not_found_user'), 'FF0000');

                return;
            }

            $data['guild_user_id'] = $this->guild_user->id;

            $original_minutes = $this->active_options->get('name', 'minutes')?->value;
            $data['value'] = $is_remove ? $original_minutes * (-1) : $original_minutes;
            $data['status'] = DutyStatusEnum::from($this->active_options->get('name', 'status')?->value) ?? DutyStatusEnum::CURRENT_PERIOD;

            $this->service->storeDuty($data, $this->target_guild_user);

            $title = $is_remove ? __('duty.success_duty_remove_from_user', ['value' => $original_minutes]) : __('duty.success_duty_add_to_user', ['value' => $original_minutes]);
            $fields[] = $this->makeEmbedField(__('guild_user.user'), '<@'.$this->target_user_id.'>');
            $data = $this->buildEmbedData('🚨 '.$title, '00FF00', '', $fields);
            $this->respondEphemeralEmbed($interaction, 'normal', $data);
        } catch (\Throwable $e) {
            Log::error('Hiba a duty hozzáadásakor: '.$e->getMessage());
            $this->respondSimpleEmbed($interaction, '❌ '.__('app.error_action'), 'FF0000');
        }
    }

    public function handleDutyResetCommand(DiscordInteraction $interaction): void
    {
        try {
            if (! $this->validateAccess($interaction, PermissionEnum::EDIT_DUTIES)) {
                return;
            }

            $updated_duties_count = DB::transaction(function () {
                $updated_duties_count = $this->guild->guildDuties()->whereNotNull('finished_at')->where('status', DutyStatusEnum::CURRENT_PERIOD)->update(['status' => DutyStatusEnum::ALL_PERIOD]);
                ActivityLog::make($this->guild->id, $this->user->id, null, ActionTypeEnum::RESET_DUTIES_IN_GUILD, ['transferred_duties_count' => $updated_duties_count]);

                return $updated_duties_count;
            });

            $this->respondSimpleEmbed($interaction, '🚨 '.__('duty.success_duty_update_status', ['count' => $updated_duties_count]), '00FF00');

        } catch (\Throwable $e) {
            Log::error('Hiba a duty törlésekor: '.$e->getMessage());
            $this->respondSimpleEmbed($interaction, '❌ '.__('app.error_action'), 'FF0000');
        }
    }

    public function handleDutyDeleteCommand(DiscordInteraction $interaction): void
    {
        try {
            if (! $this->validateAccess($interaction, PermissionEnum::DELETE_DUTIES)) {
                return;
            }

            if (! $this->target_guild_user) {
                $this->respondSimpleEmbed($interaction, '❌ '.__('app.error_not_found_user'), 'FF0000');

                return;
            }

            $status = DutyStatusEnum::from($this->active_options->get('name', 'status')?->value) ?? DutyStatusEnum::ALL_PERIOD;

            $deleted_duties_count = DB::transaction(function () use ($status) {
                $deleted_duties_count = $this->target_guild_user->duties()->whereNotNull('finished_at')->where('status', '<=', $status)->delete();
                ActivityLog::make($this->guild->id, $this->user->id, $this->target_user_id, ActionTypeEnum::RESET_DUTIES_IN_GUILD, ['delete_duties_count' => $deleted_duties_count]);

                return $deleted_duties_count;
            });

            $fields[] = $this->makeEmbedField(__('guild_user.user'), '<@'.$this->target_user_id.'>');
            $data = $this->buildEmbedData('🚨 '.__('duty.success_duties_delete_from_user', ['count' => $deleted_duties_count]), '00FF00', '', $fields);
            $this->respondEphemeralEmbed($interaction, 'normal', $data);
        } catch (\Throwable $e) {
            Log::error('Hiba a duty törlésekor: '.$e->getMessage());
            $this->respondSimpleEmbed($interaction, '❌ '.__('app.error_action'), 'FF0000');
        }
    }

    public function handleDutyClearCommand(DiscordInteraction $interaction): void
    {
        try {
            if (! $this->validateAccess($interaction, PermissionEnum::DELETE_DUTIES)) {
                return;
            }

            $status = DutyStatusEnum::from($this->active_options->get('name', 'status')?->value) ?? DutyStatusEnum::ALL_PERIOD;

            $deleted_duties_count = DB::transaction(function () use ($status) {
                $deleted_duties_count = $this->guild->guildDuties()->whereNotNull('finished_at')->where('status', '<=', $status)->delete();
                ActivityLog::make($this->guild->id, $this->user->id, null, ActionTypeEnum::RESET_DUTIES_IN_GUILD, ['deleted_duties_count' => $deleted_duties_count]);

                return $deleted_duties_count;
            });

            $this->respondSimpleEmbed($interaction, '🚨 '.__('duty.success_duty_update_status', ['count' => $deleted_duties_count]), '00FF00');

        } catch (\Throwable $e) {
            Log::error('Hiba a duty törlésekor: '.$e->getMessage());
            $this->respondSimpleEmbed($interaction, '❌ '.__('app.error_action'), 'FF0000');
        }
    }

    protected function handleCancelCommand(DiscordInteraction $interaction, ?GuildUser $guild_user, $is_force = false): void
    {
        try {
            $required_permission = $is_force ? PermissionEnum::FORCE_CANCEL_DUTIES : PermissionEnum::TOGGLE_DUTY;
            if (! $this->validateAccess($interaction, $required_permission)) {
                return;
            }

            if (! $guild_user) {
                $this->respondSimpleEmbed($interaction, '❌ '.__('app.error_not_found_user'), 'FF0000');

                return;
            }

            $active_duty = $guild_user->currentDuty()->first();

            if (! $active_duty) {
                $title = $is_force ? __('duty.not_on_duty_user') : __('duty.not_in_duty');
                $this->respondSimpleEmbed($interaction, '🚨 '.$title, 'FF0000');

                return;
            }

            DB::transaction(function () use ($active_duty, $guild_user, $is_force) {
                if (DeleteActiveDutyAction::run($active_duty, $this->user->id, $guild_user, $this->guild->guildSettings)) {
                    if ($is_force) {
                        ActivityLog::make($guild_user->guild_id, $this->user->id, $guild_user->user_id, ActionTypeEnum::FORCE_CANCEL_DUTIES, [$active_duty->toArray()]);
                    } else {
                        ActivityLog::make($guild_user->guild_id, $guild_user->user_id, null, ActionTypeEnum::CANCELED_DUTY_FROM_GUILD_USER, [$active_duty->toArray()]);
                    }
                    $active_duty->delete();
                } else {
                    throw new \Exception('Duty deletion failed logic.');
                }
            });

            $title = $is_force ? __('duty.success_duty_force_cancel') : __('duty.success_duty_cancel');
            $fields = $is_force ? [$this->makeEmbedField(__('guild_user.user'), '<@'.$guild_user->user_id.'>')] : [];
            $data = $this->buildEmbedData('🚨 '.$title, '00FF00', '', $fields);
            $this->respondEphemeralEmbed($interaction, 'normal', $data);
        } catch (\Throwable $e) {
            Log::error('Hiba a duty törlésekor: '.$e->getMessage());
            $this->respondSimpleEmbed($interaction, '❌ '.__('app.error_action'), 'FF0000');
        }
    }
}
