<?php

namespace App\Console\Commands\Bot;

use App\Actions\Bot\HandleDutyInteraction;
use App\Actions\Bot\HandleGuildUserInteraction;
use App\Actions\Bot\HandleHolidayInteraction;
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
            'intents' => Intents::getDefaultIntents() | Intents::GUILD_MEMBERS,
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
            if ($this->dev_mode) {
                if ($this->dev_guild_id === (string) $guild->id) {
                    $this->syncGuildCommands($bot, $guild);
                }
                return;
            }

            $this->syncGuildCommands($bot, $guild);
        });

        $bot->on(Event::INTERACTION_CREATE, function (DiscordInteraction $interaction) use ($bot) {
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
            ];

            if (isset($handlers[$command_name])) {
                $handlerClass = $handlers[$command_name];
                (new $handlerClass)->handle($bot, $interaction);
            } else {
                $firstHandlerClass = reset($handlers);
                (new $firstHandlerClass)->handle($bot, $interaction);
            }
        });

        $bot->on(Event::GUILD_MEMBER_UPDATE, function ($member, Discord $discord, $old_member) {
            if (! $old_member) {
                return;
            }

            if ($this->dev_mode && $this->dev_guild_id !== (string) $member->guild_id) {
                return;
            }

            $cache_key = Guild::ROLE_WHITELIST_CACHE_PREFIX.$member->guild_id;

            $whitelist = Cache::remember($cache_key, now()->addHour(), function () use ($member) {
                $guild = Guild::where('id', $member->guild_id)->with(['guildRoles', 'guildSettings'])->installed()->first();
                return $guild ? $this->listRoleWhitelist($guild) : [];
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
                if ($this->dev_mode) {
                    $this->info("Releváns rangváltozás: {$member->user->username}");
                }

                $roles_to_save = array_values(array_intersect($new_role_ids, $whitelist));
                $this->updateRoles($member->guild_id, $member->id, $roles_to_save);
            }
        });

        $bot->run();
    }
}
