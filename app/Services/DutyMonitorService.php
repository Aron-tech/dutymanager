<?php

namespace App\Services;

use App\Enums\DutyActionEnum;
use App\Enums\FeatureEnum;
use App\Models\Duty;
use App\Models\Guild;
use Discord\Builders\Components\ActionRow;
use Discord\Builders\Components\Button;
use Discord\Builders\MessageBuilder;
use Discord\Discord;
use Discord\Parts\Embed\Embed;
use Discord\WebSockets\Event;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DutyMonitorService
{
    public static function register(Discord $discord): void
    {
        $discord->on('ready', function (Discord $discord) {
            $discord->getLoop()->addPeriodicTimer(300, function () use ($discord) {
                self::runPeriodicUpdate($discord);
            });

            self::runPeriodicUpdate($discord);

            $discord->on(Event::VOICE_STATE_UPDATE, function ($state, $discord, $oldstate) {
                self::handleVoiceStateUpdate($state, $discord, $oldstate);
            });
        });
    }

    public static function runPeriodicUpdate(Discord $discord, ?string $specific_guild_id = null): void
    {
        $query = Guild::installed()->with('guildSettings');
        if ($specific_guild_id) {
            $query->where('id', $specific_guild_id);
        }
        $guilds = $query->get();

        foreach ($guilds as $guild) {
            if (! $guild->guildSettings || ! $guild->guildSettings->isEnabledFeature(FeatureEnum::DUTY)) {
                continue;
            }

            $discord_guild = $discord->guilds->get('id', $guild->id);
            if (! $discord_guild) {
                continue;
            }

            $active_duties = Duty::where('guild_id', $guild->id)
                ->whereNull('finished_at')
                ->whereNotNull('guild_user_id')
                ->with('guildUser')
                ->get();

            $active_count = $active_duties->count();

            $active_voice_id = $guild->guildSettings->getFeatureSettings(FeatureEnum::DUTY, 'active_duty_channel_id', null);
            if ($active_voice_id) {
                $voice_channel = $discord_guild->channels->get('id', $active_voice_id);
                if ($voice_channel && $voice_channel->type === 2) {
                    $new_name = '🛡️ '.__('duty.voice_on_duty', ['count' => $active_count]);
                    if ($voice_channel->name !== $new_name) {
                        $voice_channel->name = $new_name;
                        $voice_channel->save()->catch(fn ($e) => Log::error("Hiba a csatornanév módosításakor: {$e->getMessage()}"));
                    }
                }
            }

            // Panel Update
            $panel_channel_id = $guild->guildSettings->getFeatureSettings(FeatureEnum::DUTY, 'duty_panel_channel_id', null);
            if ($panel_channel_id) {
                $panel_channel = $discord_guild->channels->get('id', $panel_channel_id);
                if ($panel_channel) {
                    self::updateOrSendPanel($discord, $guild, $panel_channel, $active_duties);
                }
            }
        }
    }

    private static function updateOrSendPanel(Discord $discord, Guild $guild, $channel, $active_duties): void
    {
        $actionRow = ActionRow::new()
            ->addComponent(Button::new(Button::STYLE_SUCCESS)->setLabel(__('duty.panel_btn_start'))->setCustomId('btn_duty_start'))
            ->addComponent(Button::new(Button::STYLE_DANGER)->setLabel(__('duty.panel_btn_stop'))->setCustomId('btn_duty_stop'))
            ->addComponent(Button::new(Button::STYLE_SECONDARY)->setLabel(__('duty.panel_btn_cancel'))->setCustomId('btn_duty_cancel'))
            ->addComponent(Button::new(Button::STYLE_PRIMARY)->setLabel(__('duty.panel_btn_info'))->setCustomId('btn_duty_info'));

        $lines = [];
        if ($active_duties->isEmpty()) {
            $lines[] = '❌ '.__('duty.panel_no_active');
        } else {
            foreach ($active_duties as $duty) {
                $started = $duty->started_at->format('Y. m. d. H:i');
                $lines[] = "• <@{$duty->user_id}> - *".__('duty.panel_planned_start', ['time' => $started]).'*';
            }
        }

        $chunks = self::chunkLines($lines, 3000);
        $embeds = [];
        $total_chunks = count($chunks);

        foreach ($chunks as $index => $chunk_content) {
            $embed = new Embed($discord);
            $title = '🛡️ '.__('duty.panel_title');

            if ($total_chunks > 1) {
                $title .= ' ('.($index + 1)."/{$total_chunks})";
            }

            $embed->setTitle($title);
            $embed->setColor('#2b2d31');

            if ($index === 0) {
                $description = '**'.__('duty.panel_instructions')."**\n\n";
                $description .= '🟢 **'.__('duty.panel_start_label').'** - '.__('duty.panel_start_desc')."\n";
                $description .= '🔴 **'.__('duty.panel_stop_label').'** - '.__('duty.panel_stop_desc')."\n";
                $description .= '🔵 **'.__('duty.panel_info_label').'** - '.__('duty.panel_info_desc')."\n\n";
                $description .= '📋 **'.__('duty.panel_currently_on_duty').":**\n";
            } else {
                $description = '';
            }

            $description .= $chunk_content;
            $embed->setDescription($description);

            if ($index === $total_chunks - 1) {
                $embed->setFooter(__('duty.panel_updated').': '.now()->format('Y. m. d. H:i:s'));
            }

            $embeds[] = $embed;
        }

        $builder = MessageBuilder::new();
        foreach ($embeds as $e) {
            $builder->addEmbed($e);
        }
        $builder->addComponent($actionRow);

        $last_msg_id = $guild->guildSettings->getFeatureSettings(FeatureEnum::DUTY, 'last_duty_panel_message_id', null);

        $sendNewMessage = function () use ($channel, $builder, $guild) {
            $channel->sendMessage($builder)->then(function ($message) use ($guild) {
                $guild->guildSettings->setFeatureSettings(FeatureEnum::DUTY, 'last_duty_panel_message_id', $message->id);
                DB::table('guild_settings')
                    ->where('id', $guild->guildSettings->id)
                    ->update(['feature_settings' => json_encode($guild->guildSettings->feature_settings)]);
            })->catch(fn ($e) => Log::error("Hiba a panel küldésekor: {$e->getMessage()}"));
        };

        if ($last_msg_id) {
            $channel->messages->fetch($last_msg_id)->then(function ($message) use ($builder) {
                $message->edit($builder)->catch(fn ($e) => Log::error("Hiba a panel frissítésekor: {$e->getMessage()}"));
            })->catch(function ($e) use ($sendNewMessage) {
                $sendNewMessage();
            });
        } else {
            $sendNewMessage();
        }
    }

    private static function handleVoiceStateUpdate($state, $discord, $oldstate): void
    {
        $guild_id = $state->guild_id ?? $oldstate->guild_id;
        if (! $guild_id) {
            return;
        }

        $guild = Guild::where('id', $guild_id)->with('guildSettings')->first();
        if (! $guild || ! $guild->guildSettings || ! $guild->guildSettings->isEnabledFeature(FeatureEnum::DUTY)) {
            return;
        }

        $duty_voice_channel_id = $guild->guildSettings->getFeatureSettings(FeatureEnum::DUTY, 'duty_voice_channel_id', null);
        if (! $duty_voice_channel_id) {
            return;
        }

        $user_id = $state->user_id ?? $oldstate->user_id;

        $joined_duty_channel = $state->channel_id === $duty_voice_channel_id && ($oldstate === null || $oldstate->channel_id !== $duty_voice_channel_id);
        $left_duty_channel = $oldstate !== null && $oldstate->channel_id === $duty_voice_channel_id && ($state === null || $state->channel_id !== $duty_voice_channel_id);

        $guild_user = $guild->acceptedGuildUsers()->where('user_id', $user_id)->first();
        if (! $guild_user) {
            return;
        }

        $update_panel = false;

        if ($joined_duty_channel && ! $guild_user->hasActiveDuty()) {
            $result = $guild_user->duty();
            if ($result['duty_action'] === DutyActionEnum::ON_DUTY) {
                $duty_role = $guild->guildSettings->getFeatureSettings(FeatureEnum::DUTY, 'duty_role_id', null);
                if ($duty_role) {
                    DiscordFetchService::addRoleToMember($guild->id, $user_id, $duty_role);
                }
                $update_panel = true;
            }
        }

        if ($left_duty_channel && $guild_user->hasActiveDuty()) {
            $result = $guild_user->duty();
            if ($result['duty_action'] === DutyActionEnum::OFF_DUTY) {
                $duty_role = $guild->guildSettings->getFeatureSettings(FeatureEnum::DUTY, 'duty_role_id', null);
                if ($duty_role) {
                    DiscordFetchService::removeRoleFromMember($guild->id, $user_id, $duty_role);
                }
                $update_panel = true;
            }
        }

        if ($update_panel) {
            self::runPeriodicUpdate($discord, $guild_id);
        }
    }

    private static function chunkLines(array $lines, int $max_length = 3000): array
    {
        $chunks = [];
        $current_chunk = '';

        foreach ($lines as $line) {
            if (strlen($current_chunk) + strlen($line) > $max_length) {
                $chunks[] = trim($current_chunk);
                $current_chunk = '';
            }
            $current_chunk .= $line."\n";
        }

        if (! empty($current_chunk)) {
            $chunks[] = trim($current_chunk);
        }

        return $chunks;
    }
}
