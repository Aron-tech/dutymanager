<?php

namespace App\Models;

use App\Enums\ActionTypeEnum;
use App\Enums\FeatureEnum;
use App\Services\DiscordEmbedFactory;
use App\Services\DiscordFetchService;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\DB;

#[Fillable(['guild_user_id', 'guild_id', 'user_id', 'reason', 'started_at', 'ended_at', 'is_expired'])]
class Holiday extends Model
{
    use SoftDeletes;

    public $timestamps = false;

    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'ended_at' => 'datetime',
            'is_expired' => 'bool',
        ];
    }

    public static function make(GuildUser $guild_user, string $reason, int $duration_in_days, int $holiday_start_delay_days = 0): ?Holiday
    {
        $has_active_holiday = $guild_user->activeHoliday()->exists();

        if ($has_active_holiday) {
            return null;
        }

        $now = now();
        $started_at = $now->addDays($holiday_start_delay_days);
        $ended_at = $started_at->addDays(($duration_in_days + $holiday_start_delay_days));

        $holiday = self::create([
            'guild_user_id' => $guild_user->id,
            'guild_id' => $guild_user->guild_id,
            'user_id' => $guild_user->user_id,
            'reason' => $reason,
            'started_at' => $started_at,
            'ended_at' => $ended_at,
            'is_expired' => false,
        ]);

        ActivityLog::make($guild_user->guild_id, $guild_user->user_id, null, ActionTypeEnum::GET_HOLIDAY, $holiday->toArray());

        DB::afterCommit(function () use ($guild_user, $reason, $ended_at) {
            $guild = $guild_user->guild()->installed()->with('guildSettings')->first();
            $holiday_config = $guild->guildSettings->getFeatureSettings(FeatureEnum::HOLIDAY, null, []);
            if (! empty($holiday_config)) {
                $role_id = $holiday_config['holiday_role_id'] ?? null;
                $channel_id = $holiday_config['announcement_channel_id'] ?? null;
                if (! empty($role_id)) {
                    DiscordFetchService::addRoleToMember($guild->id, $guild_user->user_id, $role_id);
                }
                if (! empty($channel_id)) {
                    $embed = DiscordEmbedFactory::create('holiday', [
                        'user_id' => $guild_user->user_id,
                        'ended_at' => $ended_at->format('Y. m. d. H:i'),
                        'reason' => $reason,
                        'guild_name' => $guild->name,
                        'guild_icon_url' => $guild->icon ? "https://cdn.discordapp.com/icons/{$guild->id}/{$guild->icon}.png" : null,
                    ]);

                    DiscordFetchService::sendMessage($guild->id, $channel_id, null, [$embed]);
                }
            }
        });

        return $holiday;
    }

    public function guildUser(): BelongsTo
    {
        return $this->belongsTo(GuildUser::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function guild(): BelongsTo
    {
        return $this->belongsTo(Guild::class);
    }
}
