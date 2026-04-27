<?php

namespace App\Models;

use App\Enums\DutyStatusEnum;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['user_id', 'guild_id', 'guild_user_id', 'value', 'started_at', 'finished_at', 'status'])]
class Duty extends Model
{
    use SoftDeletes;

    public $timestamps = false;

    /**
     * @return string[]
     */
    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'finished_at' => 'datetime',
            'status' => DutyStatusEnum::class,
        ];
    }

    public static function getActiveDutiesCount(): int
    {
        return self::whereNull('value')->whereNull('finished_at')->count();
    }

    /**
     * @param int $value
     * @return string
     */
    public static function standardFormat(int $value): string
    {
        $hours = intdiv($value, 60);
        $minutes = $value % 60;

        return sprintf('%02d:%02d', $hours, $minutes);
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

    /**
     * @param Builder $query
     * @return Builder
     */
    public function scopeActiveDuties(Builder $query): Builder
    {
        return $query->whereNull('finished_at');
    }
}
