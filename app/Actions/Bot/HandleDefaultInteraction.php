<?php

namespace App\Actions\Bot;

use App\Concerns\DiscordCommandTrait;
use App\Concerns\DiscordEmbedTrait;
use App\Services\GuildUserService;
use Discord\Discord;
use Discord\Parts\Interactions\Interaction as DiscordInteraction;
use Lorisleiva\Actions\Concerns\AsAction;

class HandleDefaultInteraction
{
    use AsAction, DiscordCommandTrait, DiscordEmbedTrait;

    /**
     * @param Discord $discord
     * @param DiscordInteraction $interaction
     * @return void
     */
    public function handle(Discord $discord, DiscordInteraction $interaction): void
    {
        $this->init($discord, $interaction, app(GuildUserService::class));

        match ($this->command_name) {
            default => $this->respondSimpleEmbed($interaction, '❌ '.__('app.unknow_command'), 'FF0000'),
        };
    }
}
