<?php

namespace App\Actions\Bot;

use App\Concerns\DiscordCommandTrait;
use App\Concerns\DiscordEmbedTrait;
use App\Enums\ActionTypeEnum;
use App\Models\ActivityLog;
use App\Models\GuildUser;
use App\Services\GuildService;
use Discord\Discord;
use Discord\Parts\Interactions\Interaction as DiscordInteraction;
use Illuminate\Support\Facades\DB;
use Lorisleiva\Actions\Concerns\AsAction;
use Mockery\Exception;

class HandleDefaultInteraction
{
    use AsAction, DiscordCommandTrait, DiscordEmbedTrait;

    public function handle(Discord $discord, DiscordInteraction $interaction): void
    {
        $this->deferReply($interaction);
        $this->init($discord, $interaction, app(GuildService::class));

        match ($this->command_name) {
            'install' => $this->handleInstallInteraction($interaction),
            'syncpermission' => $this->syncPermission($interaction),
            default => $this->respondSimpleEmbed($interaction, '❌ '.__('app.unknow_command'), 'FF0000'),
        };
    }

    protected function handleInstallInteraction(DiscordInteraction $interaction): void
    {
        try {
            if (! $this->validateGuildSettings($interaction)) {
                return;
            }

            if ($this->guild->is_installed) {
                $this->respondSimpleEmbed($interaction, __('app.already_guild_installed'), 'FF0000');

                return;
            }

            DB::transaction(function () {
                $this->guild->update(['is_installed' => true]);

                ActivityLog::make($this->guild->id, $this->user->id, null, ActionTypeEnum::INSTALL_BOT);
            });

            $this->respondSimpleEmbed($interaction, __('app.success_guild_installation'), '00FF00');

        } catch (\Throwable $e) {
            report($e);
            $this->respondSimpleEmbed($interaction, __('app.error_action'), 'FF0000');
        }
    }

    protected function syncPermission(DiscordInteraction $interaction): void
    {
        try {
            if ($this->guild->is_installed && $this->guild->owner_id === $this->user->id) {
                $roles = $interaction->member->roles->map(fn ($role) => $role->id)->toArray();
                if (! $this->guild_user) {
                    GuildUser::create([
                        'guild_id' => $this->guild->id,
                        'user_id' => $this->user->id,
                        'ic_name' => $this->user->name,
                        'is_request' => false,
                        'accepted_at' => now(),
                        'added_by' => $this->user->id,
                        'cached_roles' => $roles,
                    ]);
                } else {
                    $this->guild_user->update(['cached_roles' => $roles]);
                }
                GuildUser::deletePermissionCache($this->guild->id, $this->user->id);
                $this->respondSimpleEmbed($interaction, 'Jogosultság szinkronizálva!', '00FF00');
            } else {
                throw new Exception('No permission to sync permissions.');
            }
        } catch (\Throwable $e) {
            report($e);
            $this->respondSimpleEmbed($interaction, __('app.error_action'), 'FF0000');
        }
    }
}
