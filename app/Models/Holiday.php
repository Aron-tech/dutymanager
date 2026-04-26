<?php

namespace App\Models;

use App\Enums\ActionTypeEnum;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['guild_user_id', 'guild_id', 'user_id', 'reason', 'started_at', 'ended_at'])]
class Holiday extends Model
{
    use SoftDeletes;

    /**
     * @param GuildUser $guild_user
     * @param string $reason
     * @param int $duration_in_days
     * @param int $holiday_start_delay_days
     * @return Holiday|null
     */
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
        ]);

        ActivityLog::make($guild_user->guild_id, $guild_user->user_id, null, ActionTypeEnum::GET_HOLIDAY, $holiday->toArray());

        return $holiday;
    }

    /**
     * @return BelongsTo
     */
    public function guildUser(): BelongsTo
    {
        return $this->belongsTo(GuildUser::class);
    }

    /**
     * @return BelongsTo
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return BelongsTo
     */
    public function guild(): BelongsTo
    {
        return $this->belongsTo(Guild::class);
    }
}
