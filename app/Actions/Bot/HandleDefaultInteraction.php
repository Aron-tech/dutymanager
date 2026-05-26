<?php

namespace App\Actions\Bot;

use App\Concerns\DiscordCommandTrait;
use App\Concerns\DiscordEmbedTrait;
use App\Enums\PermissionEnum;
use App\Services\GuildService;
use Discord\Discord;
use Discord\Parts\Interactions\Interaction as DiscordInteraction;
use Lorisleiva\Actions\Concerns\AsAction;

class HandleDefaultInteraction
{
    use AsAction, DiscordCommandTrait, DiscordEmbedTrait;

    public function handle(Discord $discord, DiscordInteraction $interaction): void
    {
        $this->init($discord, $interaction, app(GuildService::class));

        match ($this->command_name) {
            'install' => $this->handleInstallInteraction($interaction),
            default => $this->respondSimpleEmbed($interaction, '❌ '.__('app.unknow_command'), 'FF0000'),
        };
    }

    protected function handleInstallInteraction(DiscordInteraction $interaction): void
    {
        try {
            if (! $this->validateGuildSettings($interaction)) {
                return;
            }

            if (! $this->validateAccess($interaction, PermissionEnum::EDIT_SETTINGS)) {
                return;
            }

            if ($this->guild->is_installed) {
                $this->respondSimpleEmbed($interaction, __('app.already_guild_installed'), 'FF0000');

                return;
            }

            $this->guild->update(['is_installed' => true]);

            $this->respondSimpleEmbed($interaction, __('app.success_guild_installation'), '00FF00');

        } catch (\Throwable $e) {
            report($e);
            $this->respondSimpleEmbed($interaction, __('app.error_action'), 'FF0000');
        }
    }
}
