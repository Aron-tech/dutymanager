<?php

namespace App\Models;

use App\Enums\DutyStatusEnum;
use Database\Factories\DutyFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['user_id', 'guild_id', 'guild_user_id', 'value', 'started_at', 'finished_at', 'status'])]
class Duty extends Model
{
    /** @use HasFactory<DutyFactory> */
    use HasFactory, SoftDeletes;

    public $timestamps = false;

    /**
     * @return string[]
     */
    protected function casts(): array
    {
        return [
            'value' => 'integer',
            'started_at' => 'datetime',
            'finished_at' => 'datetime',
            'status' => DutyStatusEnum::class,
        ];
    }

    public static function getActiveDutiesCount(string $guild_id): int
    {
        return self::where('guild_id', $guild_id)->whereNull('finished_at')->count();
    }

    public static function standardFormat(int $value): string
    {
        $hours = intdiv($value, 60);
        $minutes = $value % 60;

        return sprintf('%02d:%02d', $hours, $minutes);
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

    public function scopeActiveDuties(Builder $query): Builder
    {
        return $query->whereNull('finished_at');
    }

    public function scopeFinishedDuties(Builder $query): Builder
    {
        return $query->whereNotNull('finished_at');
    }
}
