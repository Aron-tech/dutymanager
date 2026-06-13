<?php

namespace App\Actions\Bot;

use App\Actions\ChangeGuildUserRankAction;
use App\Actions\DeleteGuildUserAction;
use App\Concerns\DiscordCommandTrait;
use App\Concerns\DiscordEmbedTrait;
use App\Concerns\ValidatesDynamicUserDetailsTrait;
use App\Enums\DutyStatusEnum;
use App\Enums\FeatureEnum;
use App\Enums\PermissionEnum;
use App\Models\Duty;
use App\Models\GuildUser;
use App\Services\GuildUserService;
use Discord\Builders\Components\ActionRow;
use Discord\Builders\Components\Button;
use Discord\Builders\MessageBuilder;
use Discord\Discord;
use Discord\Parts\Embed\Embed;
use Discord\Parts\Interactions\Interaction as DiscordInteraction;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use Lorisleiva\Actions\Concerns\AsAction;

class HandleGuildUserInteraction
{
    use AsAction, DiscordCommandTrait, DiscordEmbedTrait, ValidatesDynamicUserDetailsTrait;

    /**
     * Execute the console command.
     *
     * @throws \Exception
     */
    public function handle(Discord $discord, DiscordInteraction $interaction): void
    {
        $this->init($discord, $interaction, app(GuildUserService::class));
        if (! $this->validateGuild($interaction)) {
            return;
        }

        if ($interaction->type === 3) {
            match ($interaction->data->custom_id) {
                'btn_duty_info' => $this->handleUserInfoCommand($interaction, $this->guild_user),
                'btn_sync_execute' => $this->handleSyncExecuteCommand($interaction),
                'btn_sync_cancel' => $this->handleSyncCancelCommand($interaction),
                default => null,
            };

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
                'add' => $this->handleUserAddCommand($interaction),
                'request' => $this->handleUserRequestCommand($interaction),
                'promote' => $this->handlePromoteCommand($interaction),
                'delete' => $this->handleUserDeleteCommand($interaction),
                'sync' => $this->handleUserSyncCommand($interaction),
                default => $this->respondSimpleEmbed($interaction, '❌ '.__('app.unknow_command'), 'FF0000'),
            };
        }
    }

    private function getValidatedDetails(DiscordInteraction $interaction): ?array
    {
        $details = [];
        $userDetailsConfig = $this->guild->guildSettings?->user_details_config ?? [];

        foreach ($userDetailsConfig as $config) {
            $optionName = $config['key'] ?? str_replace(' ', '_', strtolower($config['name']));
            $option = $this->active_options->get('name', $optionName);
            if ($option) {
                $details[$config['name']] = $option->value;
            }
        }

        $rules = $this->getDynamicDetailsRules($this->guild);
        $validator = Validator::make(['details' => $details], $rules, $this->getDynamicDetailsMessages());

        try {
            return $validator->validate()['details'] ?? [];
        } catch (ValidationException $e) {
            $errors = $e->validator->errors()->all();
            $this->respondSimpleEmbed($interaction, '❌ '.__('app.validation_error')."\n".implode("\n", $errors), 'FF0000');

            return null;
        }
    }

    protected function handleUserAddCommand(DiscordInteraction $interaction): void
    {
        if (! $this->validateAccess($interaction, PermissionEnum::ADD_GUILD_USERS)) {
            return;
        }

        if (! $this->target_user_id) {
            $this->respondSimpleEmbed($interaction, '❌ '.__('app.error_missing_user'), 'FF0000');

            return;
        }

        if ($this->target_guild_user) {
            $this->respondSimpleEmbed($interaction, '❌ '.__('guild_user.already_exists_user', ['user' => '<@'.$this->target_user_id.'>']), 'FF0000');

            return;
        }

        $details = $this->getValidatedDetails($interaction);
        if ($details === null) {
            return;
        }

        try {
            $discordUser = null;

            if ($interaction->data->resolved && $interaction->data->resolved->users) {
                $discordUser = $interaction->data->resolved->users->get('id', $this->target_user_id);
            }

            $userName = $discordUser ? $discordUser->username : 'Ismeretlen';
            $icNameOption = $this->active_options->get('name', 'ic_name');
            $icName = $icNameOption ? $icNameOption->value : ($discordUser ? ($discordUser->global_name ?? $discordUser->username) : 'Ismeretlen');

            $data = [
                'guild' => $this->guild,
                'user_id' => $this->target_user_id,
                'name' => $userName,
                'added_by' => $this->user,
                'ic_name' => $icName,
                'details' => $details,
            ];

            $guild_user = $this->service->joinUserToGuild($data);

            $this->respondSimpleEmbed($interaction, '✅ '.__('guild_user.success_added_discord_member'), '00FF00');
        } catch (\Throwable $e) {
            Log::error('Hiba a user hozzáadásakor: '.$e->getMessage(), ['exception' => $e]);
            $this->respondSimpleEmbed($interaction, '❌ '.$e->getMessage(), 'FF0000');
        }
    }

    protected function handleUserRequestCommand(DiscordInteraction $interaction): void
    {
        $user_id = $interaction->member->user->id;
        if (GuildUser::where('guild_id', $this->guild->id)->where('user_id', $user_id)->first()) {
            $this->respondSimpleEmbed($interaction, '❌ '.__('guild_user.already_exists_user', ['user' => '<@'.$user_id.'>']), 'FF0000');

            return;
        }

        $details = $this->getValidatedDetails($interaction);
        if ($details === null) {
            return;
        }

        try {
            $discordUser = $interaction->member->user;

            $userName = $discordUser ? $discordUser->username : 'Ismeretlen';
            $icNameOption = $this->active_options->get('name', 'ic_name');
            $icName = $icNameOption ? $icNameOption->value : ($discordUser ? ($discordUser->global_name ?? $discordUser->username) : 'Ismeretlen');

            $data = [
                'guild' => $this->guild,
                'user_id' => $user_id,
                'name' => $userName,
                'ic_name' => $icName,
                'details' => $details,
                'is_request' => true,
            ];

            $guild_user = $this->service->joinUserToGuild($data);

            $this->respondSimpleEmbed($interaction, '✅ '.__('guild_user.success_requested_discord_member'), '00FF00');
        } catch (\Throwable $e) {
            Log::error('Hiba a user kérelemkor: '.$e->getMessage(), ['exception' => $e]);
            $this->respondSimpleEmbed($interaction, '❌ '.$e->getMessage(), 'FF0000');
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

    public function handlePromoteCommand(DiscordInteraction $interaction): void
    {
        if (! $this->validateFeature($interaction, FeatureEnum::RANK)) {
            return;
        }

        if (! $this->validateAccess($interaction, PermissionEnum::PROMOTE_GUILD_USER)) {
            return;
        }

        if (! $this->target_guild_user) {
            $this->respondSimpleEmbed($interaction, __('guild_user.error_not_found_user'), 'FF0000');

            return;
        }

        $level = $this->active_options->get('name', 'level')?->value ?? 1;

        if (ChangeGuildUserRankAction::run($this->target_guild_user, $this->guild, 'promote', $level, $this->user->id)) {
            $this->respondSimpleEmbed($interaction, __('guild_user.success_promote_user', ['user' => $this->target_guild_user->user->name]), '00FF00');
        } else {
            $this->respondSimpleEmbed($interaction, __('guild_user.error_action'), 'FF0000');
        }
    }

    public function handleUserDeleteCommand(DiscordInteraction $interaction): void
    {
        if (! $this->validateAccess($interaction, PermissionEnum::DELETE_GUILD_USERS)) {
            return;
        }

        if (! $this->target_guild_user) {
            $this->respondSimpleEmbed($interaction, __('app.error_action'), 'FF0000');

            return;
        }

        $should_kick = $this->active_options->has('name', 'kick') ? $this->active_options->get('name', 'kick')->value : false;

        DeleteGuildUserAction::run($this->target_guild_user, $this->user->id, $should_kick);

        $this->respondSimpleEmbed($interaction, __('guild_user.success_deleted_user', ['user' => $this->target_guild_user->user->name]));

    }

    /**
     * @throws \Exception
     */
    public function handleUserSyncCommand(DiscordInteraction $interaction): void
    {
        if (! $this->validateAccess($interaction, PermissionEnum::DELETE_GUILD_USERS)) {
            return;
        }

        $discord_guild = $this->discord->guilds->get('id', $this->guild->id);

        if (! $discord_guild) {
            $this->respondSimpleEmbed($interaction, '❌ Hiba a Discord szerver lekérésekor.', 'FF0000');

            return;
        }

        $discord_guild->members->freshen()->then(function ($discord_members) use ($interaction) {
            $this->processUserSync($interaction, $discord_members);
        })->catch(function (\Throwable $e) use ($interaction, $discord_guild) {
            Log::warning('Hiba a Discord tagok freshen hívásakor, fallback a memóriára: '.$e->getMessage());
            if ($discord_guild->members && $discord_guild->members->count() > 0) {
                $this->processUserSync($interaction, $discord_guild->members);
            } else {
                Log::error('A bot memóriájában sincsenek Discord tagok.');
                $this->respondSimpleEmbed($interaction, '❌ Sikertelen taglista lekérés (API hiba és üres cache).', 'FF0000');
            }
        });
    }

    private function processUserSync(DiscordInteraction $interaction, $discord_members): void
    {
        $default_role_id = $this->guild->guildSettings?->getGeneralSettings('default_role');
        $guild_users = $this->guild->guildUsers()->get();

        $to_delete = [];
        $lines = [];

        foreach ($guild_users as $guild_user) {
            $discord_member = $discord_members->get('id', $guild_user->user_id);
            $is_in_discord = $discord_member !== null;
            $should_delete = false;
            $reason = '';

            if ($guild_user->accepted_at !== null) {
                if (! $is_in_discord) {
                    $should_delete = true;
                    $reason = 'Már nincs a Discord szerveren';
                } elseif ($default_role_id && ! $discord_member->roles->has($default_role_id)) {
                    $should_delete = true;
                    $reason = 'Hiányzó default rang';
                }
            } else {
                if (! $is_in_discord) {
                    $should_delete = true;
                    $reason = 'Nincs elfogadva és nincs a Discord szerveren';
                }
            }

            if ($should_delete) {
                $to_delete[] = $guild_user->id;
                $lines[] = "<@{$guild_user->user_id}> - {$guild_user->ic_name} - {$reason}";
            }
        }

        if (empty($to_delete)) {
            $this->respondSimpleEmbed($interaction, '✅ Minden szinkronban van, nincs törlendő felhasználó.', '00FF00');

            return;
        }

        $this->guild->setData('sync_users', $to_delete);
        $this->guild->save();
        $chunks = $this->chunkTextLines($lines, 4000);

        $builder = MessageBuilder::new();
        $builder->addEmbed(new Embed($this->discord, [
            'title' => 'Törlendő felhasználók listája',
            'description' => $chunks[0],
            'color' => hexdec('FFA500'),
        ]));

        $action_row = ActionRow::new()
            ->addComponent(
                Button::new(Button::STYLE_DANGER)
                    ->setLabel('Végrehajtás')
                    ->setCustomId('btn_sync_execute')
            )
            ->addComponent(
                Button::new(Button::STYLE_SECONDARY)
                    ->setLabel('Mégsem')
                    ->setCustomId('btn_sync_cancel')
            );

        $builder->addComponent($action_row);
        $interaction->respondWithMessage($builder->setFlags(64));
    }

    public function handleSyncExecuteCommand(DiscordInteraction $interaction): void
    {
        if (! $this->validateAccess($interaction, PermissionEnum::DELETE_GUILD_USERS)) {
            return;
        }

        $this->guild->refresh();

        $to_delete = $this->guild->getData('sync_users', []);

        if (empty($to_delete)) {
            $this->respondSimpleEmbed($interaction, '❌ Nincs törlendő adat, vagy a művelet lejárt.', 'FF0000');

            return;
        }

        $deleted_count = 0;
        foreach ($to_delete as $guild_user_id) {
            $guild_user = GuildUser::find($guild_user_id);
            if ($guild_user) {
                DeleteGuildUserAction::run($guild_user, $this->user->id, false);
                $deleted_count++;
            }
        }

        $this->guild->setData('sync_users', []);
        $this->guild->save();
        $this->respondSimpleEmbed($interaction, "✅ Szinkronizáció befejezve. ({$deleted_count} felhasználó törölve)", '00FF00');
    }

    public function handleSyncCancelCommand(DiscordInteraction $interaction): void
    {
        $this->guild->refresh();
        $this->guild->setData('sync_users', []);
        $this->guild->save();
        $this->respondSimpleEmbed($interaction, '❌ Szinkronizáció megszakítva.', 'FF0000');
    }
}
