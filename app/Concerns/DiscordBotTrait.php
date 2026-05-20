<?php

namespace App\Concerns;

use Discord\Builders\MessageBuilder;
use Discord\Discord;
use Discord\Parts\Embed\Embed;
use Discord\Parts\Interactions\Command\Command as DiscordCommand;
use React\Promise\PromiseInterface;

use function React\Promise\all;

trait DiscordBotTrait
{
    public function registerCommands(Discord $discord): PromiseInterface
    {
        $command_data = [
            'name' => 'duty',
            'description' => 'Duty rendszer kezelése',
            'type' => 1,
        ];

        $promises = [];
        foreach ($discord->guilds as $guild) {
            $command = new DiscordCommand($discord, $command_data);
            $promises[] = $guild->commands->save($command);
        }

        return all($promises);
    }

    public function processTask(array $task, Discord $discord): void
    {
        // 1. Guild lekérése
        $guild = ($task['guild_id'] ?? null) ? $discord->guilds->get('id', $task['guild_id']) : null;
        if (! $guild) {
            $this->error('Guild nem található a cache-ben: '.($task['guild_id'] ?? 'null'));

            return;
        }

        // Segédfüggvény: mindig Promise-t ad vissza a Member-ről
        $getMember = function ($guild, $userId) {
            $member = $guild->members->get('id', $userId);

            return $member ? \React\Promise\resolve($member) : $guild->members->fetch($userId);
        };

        try {
            switch ($task['action']) {
                case 'add_role':
                    $getMember($guild, $task['user_id'])->then(
                        fn ($member) => $member->addRole($task['role_id'])->then(
                            fn () => $this->info("Rang ráadva: {$task['user_id']}"),
                            fn ($e) => $this->error('Rang adási hiba: '.$e->getMessage())
                        ),
                        fn ($e) => $this->error('Tag nem található: '.$e->getMessage())
                    );
                    break;

                case 'remove_role':
                    $getMember($guild, $task['user_id'])->then(
                        fn ($member) => $member->removeRole($task['role_id'])->then(
                            fn () => $this->info("Rang levéve: {$task['user_id']}"),
                            fn ($e) => $this->error('Rang levételi hiba: '.$e->getMessage())
                        ),
                        fn ($e) => $this->error('Tag nem található: '.$e->getMessage())
                    );
                    break;

                case 'kick':
                    $getMember($guild, $task['user_id'])->then(
                        fn ($member) => $member->kick($task['reason'] ?? ''),
                        fn ($e) => $this->error('Kick hiba: '.$e->getMessage())
                    );
                    break;

                case 'ban':
                    $guild->bans->ban($task['user_id'], [
                        'reason' => $task['reason'] ?? '',
                        'delete_message_seconds' => $task['delete_message_seconds'] ?? 0,
                    ])->then(
                        fn () => $this->info("Felhasználó bannolva: {$task['user_id']}"),
                        fn ($e) => $this->error('Ban hiba: '.$e->getMessage())
                    );
                    break;

                case 'unban':
                    $guild->bans->unban($task['user_id'], $task['reason'] ?? '')->then(
                        fn () => $this->info("Felhasználó unbannolva: {$task['user_id']}"),
                        fn ($e) => $this->error('Unban hiba: '.$e->getMessage())
                    );
                    break;

                case 'timeout':
                    $getMember($guild, $task['user_id'])->then(
                        fn ($member) => $member->timeout($task['until'] ? new \DateTime($task['until']) : null, $task['reason'] ?? ''),
                        fn ($e) => $this->error('Timeout hiba: '.$e->getMessage())
                    );
                    break;

                case 'send_message':
                    $channel = $discord->getChannel($task['channel_id']);
                    if ($channel) {
                        $builder = MessageBuilder::new();
                        if ($task['content'] ?? null) {
                            $builder->setContent($task['content']);
                        }
                        foreach ($task['embeds'] ?? [] as $embedData) {
                            $builder->addEmbed(new Embed($discord, $embedData));
                        }
                        $channel->sendMessage($builder);
                    } else {
                        $this->error('Csatorna nem található: '.($task['channel_id'] ?? 'null'));
                    }
                    break;

                default:
                    $this->error('Ismeretlen Discord feladat: '.($task['action'] ?? 'null'));
            }
        } catch (\Exception $e) {
            $this->error("Kritikus hiba a feladat végrehajtásakor ({$task['action']}): ".$e->getMessage());
        }
    }
}
