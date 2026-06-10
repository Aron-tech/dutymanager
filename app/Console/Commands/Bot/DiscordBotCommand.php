<?php

namespace App\Console\Commands\Bot;

use App\Actions\Bot\HandleDefaultInteraction;
use App\Actions\Bot\HandleDutyInteraction;
use App\Actions\Bot\HandleGuildUserInteraction;
use App\Actions\Bot\HandleHolidayInteraction;
use App\Concerns\DiscordBotTrait;
use App\Models\Guild;
use App\Services\DutyMonitorService;
use Discord\Discord;
use Discord\Exceptions\IntentException;
use Discord\Parts\Interactions\Interaction as DiscordInteraction;
use Discord\WebSockets\Event;
use Discord\WebSockets\Intents;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Redis;

#[Signature('bot:start {--dev : Development mode} {--loud : Loud mode}')]
#[Description('Start discord bot command')]
class DiscordBotCommand extends Command
{
    use DiscordBotTrait;

    protected bool $dev_mode = false;

    protected ?string $dev_guild_id = null;

    /**
     * @throws IntentException
     */
    public function handle(): void
    {
        $this->dev_mode = (bool) $this->option('dev');
        $this->dev_guild_id = (string) config('services.discord.dev_guild_id');

        if ($this->dev_mode && empty($this->dev_guild_id)) {
            $this->error('Hiba: A dev mode aktív, de a services.discord.dev_guild_id nincs beállítva!');

            return;
        }

        $bot = new Discord([
            'token' => config('services.discord.token'),
            'intents' => Intents::getDefaultIntents() | Intents::GUILD_MEMBERS | Intents::GUILDS,
        ]);

        $bot->on('init', function (Discord $discord) use ($bot) {
            $bot->getLoop()->addPeriodicTimer(1.0, function () use ($discord) {
                while ($taskJson = Redis::lpop('discord_bot_tasks')) {
                    $task = json_decode($taskJson, true);
                    $this->processTask($task, $discord);
                }
            });
        });

        $bot->on(Event::GUILD_CREATE, function ($guild) use ($bot) {
            Guild::updateOrCreate(
                ['id' => $guild->id],
                [
                    'name' => $guild->name,
                    'icon' => $guild->icon,
                    'owner_id' => $guild->owner_id,
                    'lang_code' => 'hu',
                ]
            );

            if ($this->dev_mode) {
                if ($this->dev_guild_id === (string) $guild->id) {
                    $this->syncGuildCommands($bot, $guild);
                }

                return;
            }

            $this->syncGuildCommands($bot, $guild);
        });

        $bot->on('ready', function (Discord $discord) {
            foreach ($discord->guilds as $guild) {
                $this->syncAllGuildRolesToData($guild);
            }
        });

        $bot->on(Event::GUILD_ROLE_CREATE, function ($role) {
            $this->handleGuildRoleCreate($role);
        });

        $bot->on(Event::GUILD_ROLE_DELETE, function ($role) {
            $this->handleGuildRoleDelete($role);
        });

        $bot->on(Event::INTERACTION_CREATE, function (DiscordInteraction $interaction) use ($bot) {

            if ($interaction->type === 3) {
                if ($this->dev_mode && $this->dev_guild_id !== (string) $interaction->guild_id) {
                    return;
                }

                $custom_id = $interaction->data->custom_id;

                if (str_starts_with($custom_id, 'btn_duty_info')) {
                    (new HandleGuildUserInteraction)->handle($bot, $interaction);
                } elseif (str_starts_with($custom_id, 'btn_duty_')) {
                    (new HandleDutyInteraction)->handle($bot, $interaction);
                }

                return;
            }

            if ($interaction->type !== 2) {
                return;
            }

            if ($this->dev_mode && $this->dev_guild_id !== (string) $interaction->guild_id) {
                $this->info('Kivétel: '.$this->dev_guild_id.' Aktuális: '.$interaction->guild_id);

                return;
            }

            $command_name = $interaction->data->name;

            if ($this->dev_mode) {
                $this->info('Interakció érkezett: '.$command_name);
            }

            $handlers = [
                'duty' => HandleDutyInteraction::class,
                'info' => HandleGuildUserInteraction::class,
                'user' => HandleGuildUserInteraction::class,
                'holiday' => HandleHolidayInteraction::class,
                'default' => HandleDefaultInteraction::class,
            ];

            if (isset($handlers[$command_name])) {
                $handlerClass = $handlers[$command_name];
                (new $handlerClass)->handle($bot, $interaction);
            } else {
                $defaultHandler = $handlers['default'];
                (new $defaultHandler)->handle($bot, $interaction);
            }
        });

        $bot->on(Event::GUILD_MEMBER_ADD, function ($member) {
            $this->handleRoleSync($member);
        });

        $bot->on(Event::GUILD_MEMBER_UPDATE, function ($member, Discord $discord, $old_member) {
            if (! $old_member) {
                return;
            }
            $this->handleRoleSync($member);
        });

        DutyMonitorService::register($bot);

        $bot->run();
    }
}
