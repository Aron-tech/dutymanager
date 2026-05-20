<?php

namespace App\Concerns;

use App\Enums\PermissionEnum;
use App\Models\Guild;
use App\Models\GuildUser;
use App\Models\User;
use App\Services\DiscordEmbedFactory;
use App\Services\SelectedGuildService;
use Discord\Builders\MessageBuilder;
use Discord\Discord;
use Discord\Parts\Embed\Embed;
use Discord\Parts\Interactions\Interaction as DiscordInteraction;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Gate;

trait DiscordCommandTrait
{
    protected mixed $service;

    protected ?Guild $guild = null;

    protected ?User $user = null;

    protected ?GuildUser $guild_user = null;

    protected ?Discord $discord = null;

    protected function init(Discord $discord, DiscordInteraction $interaction, mixed $service, array $data = []): void
    {
        $locale = $this->guild->lang_code ?? config('app.locale');
        App::setLocale($locale);
        $this->discord = $discord;
        $this->service = $service;
        $guild_id = $this->getGuildId($interaction);
        SelectedGuildService::setFromDiscord($guild_id);
        $this->guild = SelectedGuildService::get();

        $this->user = User::where('id', $interaction->member->user->id)->first();

        if ($this->guild && $this->user) {
            $this->guild_user = $this->guild->acceptedGuildUsers()->where('user_id', $this->user->id)->first();
        }

        foreach ($data as $key => $value) {
            $this->{$key} = $value;
        }
    }

    protected function hasPermission(DiscordInteraction $interaction, PermissionEnum $permission): bool
    {
        if (empty($this->guild) || empty($this->user) || empty($this->guild_user)) {
            return false;
        }

        if (Gate::forUser($this->user)->denies($permission->value)) {
            $this->respondSimpleEmbed($interaction, '❌ '.__('app.error_no_permission'), 'FF0000');

            return false;
        }

        return true;
    }

    protected function respondEphemeral(DiscordInteraction $interaction, string|array $messageOrEmbed): void
    {
        $builder = MessageBuilder::new();

        if (is_array($messageOrEmbed)) {
            $embed = new Embed($this->discord, $messageOrEmbed);
            $builder->addEmbed($embed);
        } else {
            $builder->setContent($messageOrEmbed);
        }

        $interaction->respondWithMessage($builder->setFlags(64));
    }

    protected function respondEphemeralEmbed(DiscordInteraction $interaction, string $type, array $data = []): void
    {
        if ($this->guild) {
            $data['guild_name'] ??= $this->guild->name;
            $data['guild_icon_url'] ??= $this->guild->icon ? "https://cdn.discordapp.com/icons/{$this->guild->id}/{$this->guild->icon}.png" : null;
        }

        $embedData = DiscordEmbedFactory::create($type, $data);

        $this->respondEphemeral($interaction, $embedData);
    }

    protected function respondSimpleEmbed(DiscordInteraction $interaction, string $title, string $color = '0000FF'): void
    {
        $data = $this->buildEmbedData($title, $color);
        $this->respondEphemeralEmbed($interaction, 'normal', $data);
    }

    protected function getGuildId(DiscordInteraction $interaction): ?string
    {
        return $interaction->guild_id;
    }
}
