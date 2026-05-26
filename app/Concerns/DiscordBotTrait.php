<?php

namespace App\Concerns;

use App\Enums\FeatureEnum;
use App\Models\Guild;
use App\Models\GuildUser;
use Discord\Builders\MessageBuilder;
use Discord\Discord;
use Discord\Parts\Embed\Embed;
use Discord\Parts\Interactions\Command\Command as DiscordCommand;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use React\Promise\Deferred;
use React\Promise\PromiseInterface;
use Throwable;

use function React\Promise\all;

trait DiscordBotTrait
{
    public function syncGuildCommands(Discord $discord, $guild): PromiseInterface
    {
        $this->info("Szinkronizálás indítása a szerveren: {$guild->name}");

        return $guild->commands->freshen()->then(function ($commands) use ($discord, $guild) {
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
        $translateOption = function (array $option) use (&$translateOption) {
            if (isset($option['description']) && $option['description']) {
                $option['description'] = __($option['description']);
            }

            if (isset($option['choices']) && is_array($option['choices'])) {
                foreach ($option['choices'] as $key => $choice) {
                    if (isset($choice['name']) && $choice['name']) {
                        $option['choices'][$key]['name'] = __($choice['name']);
                    }
                }
            }

            if (isset($option['options']) && is_array($option['options'])) {
                foreach ($option['options'] as $key => $sub_option) {
                    $option['options'][$key] = $translateOption($sub_option);
                }
            }

            return $option;
        };

        if (isset($data['description']) && $data['description']) {
            $data['description'] = __($data['description']);
        }

        if (isset($data['options']) && is_array($data['options'])) {
            foreach ($data['options'] as $key => $option) {
                $data['options'][$key] = $translateOption($option);
            }
        }

        return new DiscordCommand($discord, $data);
    }

    /**
     * Megbízható tag lekérdezés cache validációval.
     * @throws \Exception
     */
    protected function getValidMember(\Discord\Parts\Guild\Guild $guild, string $user_id, bool $force_fetch = false): PromiseInterface
    {
        if ($force_fetch) {
            return $guild->members->fetch($user_id, true);
        }

        $member = $guild->members->get('id', $user_id);

        if ($member) {
            try {
                $member->roles;
                return \React\Promise\resolve($member);
            } catch (Throwable) {
                return $guild->members->fetch($user_id, true);
            }
        }

        return $guild->members->fetch($user_id);
    }

    /**
     * Profi újrapróbálkozó mechanizmus ReactPHP EventLoop delay-el.
     */
    protected function executeWithRetry(Discord $discord, int $max_attempts, callable $operation, float $delay_seconds = 1.0, int $current_attempt = 1): PromiseInterface
    {
        return \React\Promise\resolve(null)->then(function () use ($operation, $current_attempt) {
            return $operation($current_attempt);
        })->catch(function (Throwable $e) use ($discord, $max_attempts, $operation, $delay_seconds, $current_attempt) {
            if ($current_attempt >= $max_attempts) {
                return \React\Promise\reject($e);
            }

            $deferred = new Deferred;

            $discord->getLoop()->addTimer($delay_seconds, function () use ($deferred, $discord, $max_attempts, $operation, $delay_seconds, $current_attempt) {
                $this->executeWithRetry($discord, $max_attempts, $operation, $delay_seconds, $current_attempt + 1)
                    ->then([$deferred, 'resolve'], [$deferred, 'reject']);
            });

            return $deferred->promise();
        });
    }

    /**
     * Fő feladat feldolgozó.
     */
    public function processTask(array $task, Discord $discord): void
    {
        $guild_id = $task['guild_id'] ?? null;
        $guild = $guild_id ? $discord->guilds->get('id', $guild_id) : null;
        $action = $task['action'] ?? null;
        $user_id = $task['user_id'] ?? null;

        if (! $guild && $guild_id && $action !== 'send_message') {
            $this->error("Guild nem található a cache-ben: {$guild_id}");

            return;
        }

        try {
            switch ($action) {
                case 'add_role':
                case 'remove_role':
                    $role_id = $task['role_id'];

                    $this->executeWithRetry($discord, 3, function (int $attempt) use ($guild, $user_id, $role_id, $action) {
                        $force_fetch = $attempt > 1; // 2. és 3. alkalommal erőszakolt API lekérés

                        return $this->getValidMember($guild, $user_id, $force_fetch)->then(function ($member) use ($role_id, $action) {
                            return $action === 'add_role'
                                ? $member->addRole($role_id)
                                : $member->removeRole($role_id);
                        });
                    }, 1.5)->then( // 1.5 másodperc várakozás a próbálkozások között
                        fn () => $this->info("Rang művelet ({$action}) sikeres: {$user_id}"),
                        fn ($e) => $this->error("Rang művelet sikertelen 3 próba után: {$e->getMessage()}")
                    );
                    break;

                case 'kick':
                    $this->getValidMember($guild, $user_id)->then(
                        fn ($member) => $member->kick($task['reason'] ?? ''),
                        fn ($e) => $this->error("Kick hiba: {$e->getMessage()}")
                    );
                    break;

                case 'ban':
                    $guild->bans->ban($user_id, [
                        'reason' => $task['reason'] ?? '',
                        'delete_message_seconds' => $task['delete_message_seconds'] ?? 0,
                    ])->then(
                        fn () => $this->info("Felhasználó bannolva: {$user_id}"),
                        fn ($e) => $this->error("Ban hiba: {$e->getMessage()}")
                    );
                    break;

                case 'unban':
                    $guild->bans->unban($user_id, $task['reason'] ?? '')->then(
                        fn () => $this->info("Felhasználó unbannolva: {$user_id}"),
                        fn ($e) => $this->error("Unban hiba: {$e->getMessage()}")
                    );
                    break;

                case 'timeout':
                    $this->getValidMember($guild, $user_id)->then(
                        fn ($member) => $member->timeout($task['until'] ? new \DateTime($task['until']) : null, $task['reason'] ?? ''),
                        fn ($e) => $this->error("Timeout hiba: {$e->getMessage()}")
                    );
                    break;

                case 'send_message':
                    $channel_id = $task['channel_id'] ?? null;

                    $proceed = function ($guild) use ($discord, $channel_id, $task) {
                        $channel = $guild ? $guild->channels->get('id', $channel_id) : $discord->getChannel($channel_id);

                        if ($channel) {
                            $builder = MessageBuilder::new();
                            if ($task['content'] ?? null) {
                                $builder->setContent($task['content']);
                            }
                            foreach ($task['embeds'] ?? [] as $embed_data) {
                                $builder->addEmbed(new Embed($discord, $embed_data));
                            }
                            $channel->sendMessage($builder);
                        } else {
                            $this->error("Csatorna nem található: {$channel_id}");
                        }
                    };

                    if (! $guild && $guild_id) {
                        $discord->guilds->fetch($guild_id)->then(
                            fn ($fetched_guild) => $proceed($fetched_guild),
                            fn () => $proceed(null)
                        );
                    } else {
                        $proceed($guild);
                    }
                    break;

                default:
                    $this->error("Ismeretlen Discord feladat: {$action}");
            }
        } catch (Throwable $e) {
            $this->error("Kritikus hiba a feladat végrehajtásakor ({$action}): {$e->getMessage()}");
        }
    }

    public function listRoleWhitelist(Guild $guild): array
    {
        $guild_settings = $guild->guildSettings;

        $rank_role_ids = [];
        $guild_role_ids = [];
        foreach ($guild->guildRoles as $role) {
            $guild_role_ids[] = $role->role_id;
        }

        if ($guild_settings->isEnabledFeature(FeatureEnum::RANK)) {
            $rank_role_ids = $guild_settings->getFeatureSettings(FeatureEnum::RANK, 'rank_roles', []);
        }

        return array_unique(array_merge($guild_role_ids, $rank_role_ids));
    }

    /**
     * @throws Throwable
     */
    public function updateRoles(string $guild_id, string $user_id, array $role_ids): void
    {
        DB::beginTransaction();

        try {
            $updated = GuildUser::where('guild_id', $guild_id)->where('user_id', $user_id)->accepted()->update(['cached_roles' => $role_ids]);

            if ($updated < 1) {
                DB::rollBack();

                return;
            }

            GuildUser::deletePermissionCache($guild_id, $user_id);

            DB::commit();

        } catch (Throwable $e) {
            DB::rollBack();

            Log::error('Hiba a rangok frissítésekor: '.$e->getMessage(), [
                'guild_id' => $guild->id ?? null,
                'user_id' => $data['user_id'] ?? null,
                'exception' => $e,
            ]);
        }
    }

    public function findGuild(Discord $discord, string $guildId): ?\Discord\Parts\Guild\Guild
    {
        $guild = $discord->guilds->get('id', $guildId);

        if ($guild) {
            return $guild;
        }

        return null;
    }
}
