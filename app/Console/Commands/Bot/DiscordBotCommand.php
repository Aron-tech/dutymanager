<?php

namespace App\Console\Commands\Bot;

use App\Actions\Bot\HandleDutyInteraction;
use App\Actions\Bot\HandleGuildUserInteraction;
use App\Concerns\DiscordBotTrait;
use App\Models\Guild;
use Discord\Discord;
use Discord\Exceptions\IntentException;
use Discord\Parts\Interactions\Interaction as DiscordInteraction;
use Discord\WebSockets\Event;
use Discord\WebSockets\Intents;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Redis;
use Throwable;

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

        $bot->on(Event::GUILD_MEMBER_UPDATE, function ($member, Discord $discord, $old_member) {
            if (! $old_member) {
                return;
            }

            $cache_key = Guild::ROLE_WHITELIST_CACHE_PREFIX.$member->guild_id;

            $whitelist = Cache::remember($cache_key, now()->addHour(), function () use ($member) {
                $guild = Guild::where('id', $member->guild_id)->with(['guildRoles', 'guildSettings'])->installed()->first();
                if (! $guild) {
                    return [];
                }

                return $this->listRoleWhitelist($guild);
            });

            if (empty($whitelist)) {
                return;
            }

            $old_role_ids = array_values($old_member->roles->keys());
            $new_role_ids = array_values($member->roles->keys());

            $added = array_diff($new_role_ids, $old_role_ids);
            $removed = array_diff($old_role_ids, $new_role_ids);

            $relevant_added = array_intersect($added, $whitelist);
            $relevant_removed = array_intersect($removed, $whitelist);

            if (! empty($relevant_added) || ! empty($relevant_removed)) {
                $this->info("Releváns rangváltozás: {$member->user->username}");

                $roles_to_save = array_values(array_intersect($new_role_ids, $whitelist));
                $this->updateRoles($member->guild_id, $member->id, $roles_to_save);
            }
        });

        $bot->run();
    }
}
