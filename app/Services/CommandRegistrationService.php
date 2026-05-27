<?php

namespace App\Services;

use App\Models\Guild;
use Discord\Discord;
use Discord\Parts\Interactions\Command\Command;
use Illuminate\Support\Str;
use React\Promise\PromiseInterface;

class CommandRegistrationService
{
    public function __construct(protected Discord $discord) {}

    /**
     * Belépési pont a kezdeti regisztrációhoz (minden parancs).
     */
    public function getGuildCommands(Guild $guild): array
    {
        $allCommands = config('bot_commands', []);

        // Megkeressük és kicseréljük a 'user' parancsot a dinamikus verziójára.
        foreach ($allCommands as $index => &$command) {
            if ($command['name'] === 'user') {
                $command = $this->buildDynamicUserCommand($guild);
                break;
            }
        }

        return $allCommands;
    }

    /**
     * Belépési pont csak a 'user' parancs frissítéséhez.
     */
    public function syncUserAddCommand(\Discord\Parts\Guild\Guild $discordGuild, Guild $dbGuild): PromiseInterface
    {
        $userCommandData = $this->buildDynamicUserCommand($dbGuild);
        $command = $this->commandFormatter($this->discord, $userCommandData);

        return $discordGuild->commands->save($command);
    }

    /**
     * Felépíti a teljes dinamikus '/user' parancs struktúrát.
     */
    private function buildDynamicUserCommand(Guild $guild): array
    {
        $allCommandsFromConfig = config('bot_commands', []);
        $userCommandBase = collect($allCommandsFromConfig)->firstWhere('name', 'user');

        if ($userCommandBase === null) {
            return []; // Ha nincs 'user' parancs a configban, nem csinálunk semmit.
        }

        // Felépítjük a dinamikus 'add' alparancsot.
        $dynamicAddSubCommand = [
            'name' => 'add',
            'description' => 'guild_user.user_add_command_description',
            'type' => 1, // SUB_COMMAND
            'options' => $this->buildUserAddCommandOptions($guild),
        ];

        // Kicseréljük a statikus 'add' alparancsot a dinamikusra, a többit békén hagyjuk.
        $finalSubCommands = [];
        $addCommandFound = false;
        if (isset($userCommandBase['options'])) {
            foreach ($userCommandBase['options'] as $subCommand) {
                if ($subCommand['name'] === 'add') {
                    $finalSubCommands[] = $dynamicAddSubCommand;
                    $addCommandFound = true;
                } else {
                    $finalSubCommands[] = $subCommand;
                }
            }
        }

        if (! $addCommandFound) {
            $finalSubCommands[] = $dynamicAddSubCommand;
        }

        $userCommandBase['options'] = $finalSubCommands;

        return $userCommandBase;
    }

    /**
     * Felépíti a '/user add' parancs opcióit, helyes sorrendben.
     */
    private function buildUserAddCommandOptions(Guild $guild): array
    {
        $requiredOptions = [
            [
                'name' => 'user',
                'description' => 'guild_user.user_option_description',
                'type' => 6, // USER
                'required' => true,
            ],
            [
                'name' => 'ic_name',
                'description' => 'guild_user.ic_name',
                'type' => 3, // STRING
                'required' => true,
            ],
        ];
        $optionalOptions = [];

        $userDetailsConfig = $guild->guildSettings?->user_details_config ?? [];

        foreach ($userDetailsConfig as $config) {
            $option = [
                'name' => $config['key'] ?? Str::slug($config['name'], '_'),
                'description' => $config['name'],
                'required' => $config['required'] ?? false,
            ];

            switch ($config['type'] ?? 'string') {
                case 'int':
                    $option['type'] = 4; // INTEGER
                    if (isset($config['min'])) {
                        $option['min_value'] = (int) $config['min'];
                    }
                    if (isset($config['max'])) {
                        $option['max_value'] = (int) $config['max'];
                    }
                    break;
                case 'bool':
                    $option['type'] = 5; // BOOLEAN
                    break;
                case 'float':
                    $option['type'] = 10; // NUMBER
                    if (isset($config['min'])) {
                        $option['min_value'] = (float) $config['min'];
                    }
                    if (isset($config['max'])) {
                        $option['max_value'] = (float) $config['max'];
                    }
                    break;
                default:
                    $option['type'] = 3; // STRING
                    if (isset($config['min'])) {
                        $option['min_length'] = (int) $config['min'];
                    }
                    if (isset($config['max'])) {
                        $option['max_length'] = (int) $config['max'];
                    }
                    break;
            }

            if ($option['required']) {
                $requiredOptions[] = $option;
            } else {
                $optionalOptions[] = $option;
            }
        }

        return array_merge($requiredOptions, $optionalOptions);
    }

    /**
     * Lefordítja a parancs leírásait.
     */
    public function commandFormatter(Discord $discord, array $data): Command
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

        return new Command($discord, $data);
    }
}
