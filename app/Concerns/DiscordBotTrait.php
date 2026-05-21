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
    /**
     * @param Discord $discord
     * @return PromiseInterface
     */
    public function syncCommands(Discord $discord): PromiseInterface
    {
        $promises = [];

        foreach ($discord->guilds as $guild) {
            $this->info("Szinkronizálás indítása a szerveren: {$guild->name}");

            $promises[] = $guild->commands->freshen()->then(function ($commands) use ($discord, $guild) {
                $delete_promises = [];

                foreach ($commands as $command) {
                    $delete_promises[] = $guild->commands->delete($command);
                }

                return all($delete_promises)->then(function () use ($discord, $guild) {
                    $this->info("Régi parancsok törölve, újak regisztrálása: {$guild->name}");

                    return $this->registerGuildCommands($discord, $guild);
                });
            });
        }

        return all($promises);
    }

    /**
     * @param Discord $discord
     * @param $guild
     * @return PromiseInterface
     */
    public function registerGuildCommands(Discord $discord, $guild): PromiseInterface
    {
        $command_data = config('bot_commands', []);
        $promises = [];

        foreach ($command_data as $data) {
            $formatted = $this->commandFormatter($discord, $data);
            $promises[] = $guild->commands->save($formatted)->then(
                fn ($cmd) => $this->info("Sikeres regisztráció: {$guild->name} -> /{$cmd->name}"),
                fn ($e) => $this->error("Hiba a(z) {$data['name']} parancsnál ({$guild->name}): {$e->getMessage()}")
            );
        }

        return all($promises);
    }

    private function commandFormatter(Discord $discord, array $data): ?DiscordCommand
    {
        if (isset($data['description']) && $data['description']) {
            $data['description'] = __($data['description']);
        }

        if (isset($data['options'])) {
            foreach ($data['options'] as $key => $option) {
                if (isset($option['description']) && $option['description']) {
                    $data['options'][$key]['description'] = __($option['description']);
                }

                if (isset($option['options'])) {
                    foreach ($option['options'] as $sub_key => $sub_option) {
                        if (isset($sub_option['description']) && $sub_option['description']) {
                            $data['options'][$key]['options'][$sub_key]['description'] = __($sub_option['description']);
                        }
                    }
                }
            }
        }

        return new DiscordCommand($discord, $data);
    }

    public function processTask(array $task, Discord $discord): void
    {
        $guild = ($task['guild_id'] ?? null) ? $discord->guilds->get('id', $task['guild_id']) : null;
        if (! $guild) {
            $this->error('Guild nem található a cache-ben: '.($task['guild_id'] ?? 'null'));

            return;
        }

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
