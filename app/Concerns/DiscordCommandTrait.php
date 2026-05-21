<?php

namespace App\Concerns;

use App\Enums\FeatureEnum;
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
    protected string $command_name;

    protected mixed $service;

    protected ?Guild $guild = null;

    protected ?User $user = null;

    protected ?GuildUser $guild_user = null;

    protected ?string $target_user_id = null;

    protected ?GuildUser $target_guild_user = null;

    protected ?Discord $discord = null;

    protected function init(Discord $discord, DiscordInteraction $interaction, mixed $service, array $data = []): void
    {
        $this->command_name = $interaction->data->name;
        $this->discord = $discord;
        $this->service = $service;
        $guild_id = $this->getGuildId($interaction);
        SelectedGuildService::setFromDiscord($guild_id);
        $this->guild = SelectedGuildService::get();
        $locale = $this->guild->lang_code ?? config('app.locale');
        App::setLocale($locale);

        $this->user = User::where('id', $interaction->member->user->id)->first();

        if ($this->guild && $this->user) {
            $this->guild_user = $this->guild->acceptedGuildUsers()->where('user_id', $this->user->id)->first();
        }

        if ($interaction->data->options !== null && $interaction->data->options->count() > 0) {
            $option = $interaction->data->options->get('name', 'user') ?? $interaction->data->options->get('name', 'discord_id');
            $raw_id = $option?->value;

            if ($raw_id) {
                $target_user_id = $this->validateUserId($raw_id);

                if ($target_user_id) {
                    $this->target_user_id = $target_user_id;
                    $this->target_guild_user = $this->guild->acceptedGuildUsers()->where('user_id', $target_user_id)->first();
                }
            }
        }

        foreach ($data as $key => $value) {
            $this->{$key} = $value;
        }
    }

    /**
     * @param DiscordInteraction $interaction
     * @param FeatureEnum|null $feature = null
     *
     * @return bool
     */
    protected function validateGuild(DiscordInteraction $interaction, ?FeatureEnum $feature = null): bool
    {
        $is_invalid = !$this->guild || !$this->guild->is_installed || !$this->guild->guildSettings || ($feature && empty($this->guild->guildSettings->getFeatureSettings($feature, null)));

        if ($is_invalid) {
            $this->respondSimpleEmbed($interaction, '❌ '.__('app.not_installed'), 'FF0000');
            return false;
        }

        return true;
    }

    protected function validateFeature(DiscordInteraction $interaction, FeatureEnum $feature): bool
    {
        if (! $this->validateGuild($interaction, $feature)) {
            return false;
        }

        if (! $this->guild->guildSettings->isEnabledFeature($feature)) {
            $this->respondSimpleEmbed($interaction, '❌ '.__('app.feature_not_enabled'), 'FF0000');
            return false;
        }

        return true;
    }

    private function validateUserId(?string $user_id): ?string
    {
        if (empty($user_id)) {
            return null;
        }

        if (!preg_match('/^\d{17,20}$/', $user_id)) {
            return null;
        }

        return $user_id;
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
