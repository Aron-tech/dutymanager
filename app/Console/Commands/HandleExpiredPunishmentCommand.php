<?php

namespace App\Console\Commands;

use App\Enums\FeatureEnum;
use App\Enums\PunishmentTypeEnum;
use App\Jobs\RemoveDiscordRoleJob;
use App\Models\GuildSettings;
use App\Models\Punishment;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Bus;

#[Signature('app:handle-expired-punishment-command {--loud : Output progress information}')]
#[Description('Lejárt büntetések lezárása és Discord rangok levétele')]
class HandleExpiredPunishmentCommand extends Command
{
    public function handle(): void
    {
        $is_loud = $this->option('loud');

        if ($is_loud) {
            $this->info('Handling expired punishments started.');
        }

        $punishments = Punishment::with('guildUser')
            ->whereNotNull('expires_at')
            ->where('expires_at', '<=', now())
            ->where('is_expired', false)
            ->whereHas('guildUser', fn ($q) => $q->accepted())
            ->whereHas('guild', fn ($q) => $q->installed())
            ->get();

        if ($punishments->isEmpty()) {
            if ($is_loud) {
                $this->info('No expired punishments found.');
            }

            return;
        }

        $affected_guild_ids = $punishments->pluck('guild_id')->unique();
        $guild_settings_collection = GuildSettings::whereIn('guild_id', $affected_guild_ids)->get()->keyBy('guild_id');

        $jobs = [];
        $processed_punishment_ids = [];

        foreach ($punishments as $punishment) {
            if ($punishment->type === PunishmentTypeEnum::WARNING) {
                $guild_settings = $guild_settings_collection->get($punishment->guild_id);

                if ($guild_settings && $guild_settings->isEnabledFeature(FeatureEnum::WARN)) {
                    $warning_roles = $guild_settings->getFeatureSettings(FeatureEnum::WARN, 'warning_roles', []);
                    $warning_roles_count = count($warning_roles);

                    if ($warning_roles_count > 0) {
                        $index = $punishment->level - 1;
                        $role_id = $index < $warning_roles_count
                            ? $warning_roles[$index]
                            : $warning_roles[$warning_roles_count - 1];

                        if (! empty($role_id)) {
                            $jobs[] = new RemoveDiscordRoleJob($punishment->guild_id, $punishment->user_id, [$role_id]);
                        }
                    }
                }
            }

            $processed_punishment_ids[] = $punishment->id;
        }

        if (! empty($processed_punishment_ids)) {
            Punishment::whereIn('id', $processed_punishment_ids)->update(['is_expired' => true]);
        }

        if (! empty($jobs)) {
            Bus::batch($jobs)->dispatch();
        }

        if ($is_loud) {
            $this->info('Handling expired punishments finished.');
        }
    }
}
