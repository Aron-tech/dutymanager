<?php

namespace App\Console\Commands\Bot;

use App\Actions\Bot\HandleGuildUserInteraction;
use App\Actions\Bot\HandleDutyInteraction;
use App\Concerns\DiscordBotTrait;
use Discord\Discord;
use Discord\Exceptions\IntentException;
use Discord\Parts\Interactions\Interaction as DiscordInteraction;
use Discord\WebSockets\Event;
use Discord\WebSockets\Intents;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Redis;

#[Signature('bot:start')]
#[Description('Start discord bot command')]
class DiscordBotCommand extends Command
{
    use DiscordBotTrait;

    /**
     * @throws IntentException
     */
    public function handle(): void
    {
        $bot = new Discord([
            'token' => config('services.discord.token'),
            'intents' => Intents::getDefaultIntents() | Intents::GUILD_MEMBERS,
        ]);

        $bot->on('init', function (Discord $discord) use ($bot) {
            $this->syncCommands($discord)->then(function () {
                $this->info('Minden szerveren befejeződött a parancsok szinkronizálása.');
            });
            $bot->getLoop()->addPeriodicTimer(1.0, function () use ($discord) {
                while ($taskJson = Redis::lpop('discord_bot_tasks')) {
                    $task = json_decode($taskJson, true);
                    $this->processTask($task, $discord);
                }
            });
        });

        $bot->on(Event::GUILD_CREATE, function ($guild) use ($bot) {
            $this->registerGuildCommands($bot, $guild);
        });

        $bot->on(Event::INTERACTION_CREATE, function (DiscordInteraction $interaction) use ($bot) {
            if ($interaction->type !== 2) {
                return;
            }

            $this->info('Interakció érkezett: '.$interaction->data->name);

            $handlers = [
                'duty' => HandleDutyInteraction::class,
                'info' => HandleGuildUserInteraction::class,
                'user' => HandleGuildUserInteraction::class,
            ];

            $command_name = $interaction->data->name;

            if (isset($handlers[$command_name])) {
                $handlerClass = $handlers[$command_name];
                (new $handlerClass)->handle($bot, $interaction);
            }
        });

        $bot->run();
    }
}
