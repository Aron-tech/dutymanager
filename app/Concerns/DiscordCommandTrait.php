<?php

namespace App\Concerns;

use App\Enums\PermissionEnum;
use App\Models\Guild;
use App\Models\GuildUser;
use App\Models\User;
use App\Services\SelectedGuildService;
use Discord\Builders\MessageBuilder;
use Illuminate\Support\Facades\Gate;
use Discord\Parts\Interactions\Interaction as DiscordInteraction;

trait DiscordCommandTrait
{
    protected mixed $service;

    protected ?Guild $guild = null;

    protected ?User $user = null;

    protected ?GuildUser $guild_user = null;

    protected function init(DiscordInteraction $interaction, mixed $service, array $data = []): void
    {
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
            $this->respondEphemeral($interaction, __('app.error_permission'));

            return false;
        }

        return true;
    }

    protected function respondEphemeral(DiscordInteraction $interaction, string $message): void
    {
        $builder = MessageBuilder::new()->setContent($message);
        $interaction->respondWithMessage($builder->setFlags(64));
    }

    protected function getGuildId(DiscordInteraction $interaction): ?string
    {
        return $interaction->guild_id;
    }
}
