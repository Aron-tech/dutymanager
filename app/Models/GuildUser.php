<?php

namespace App\Models;

use App\Enums\ActionTypeEnum;
use App\Enums\DutyActionEnum;
use App\Enums\DutyStatusEnum;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Support\Facades\Cache;

#[Fillable(['user_id', 'guild_id', 'ic_name', 'details', 'is_request', 'accepted_at', 'added_by', 'cached_roles', 'rank_changed_at'])]
#[Hidden(['cached_roles'])]
class GuildUser extends Model
{
    protected $appends = ['joined_ago'];

    /**
     * @return string[]
     */
    protected function casts(): array
    {
        return [
            'details' => 'array',
            'is_request' => 'bool',
            'accepted_at' => 'datetime',
            'cached_roles' => 'array',
            'roles_last_synced' => 'datetime',
            'rank_changed_at' => 'datetime',
        ];
    }

    public function getJoinedAgoAttribute(): string
    {
        if (empty($this->created_at)) {
            return 'N/A';
        }
        $days = (int) $this->created_at->diffInDays(now());
        if ($days === 0) {
            return 'Ma';
        }
        if ($days === 1) {
            return '1 napja';
        }

        return "{$days} napja";
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function guild(): BelongsTo
    {
        return $this->belongsTo(Guild::class);
    }

    public function duties(): HasMany
    {
        return $this->hasMany(Duty::class);
    }

    public function getDutiesValue(DutyStatusEnum $status = DutyStatusEnum::CURRENT_PERIOD): int
    {
        return $this->duties()->where('status', '<=', $status)->sum('value');
    }

    public function currentDuty(): HasOne
    {
        return $this->hasOne(Duty::class)->where('status', '<=', DutyStatusEnum::CURRENT_PERIOD)->whereNull('finished_at')->latest('started_at');
    }

    public function hasActiveDuty(): bool
    {
        return $this->currentDuty()->exists();
    }

    public function images(): MorphMany
    {
        return $this->morphMany(Image::class, 'imageable');
    }

    public function punishments(): HasMany
    {
        return $this->hasMany(Punishment::class, 'guild_user_id', 'id')->withTrashed();
    }

    /**
     * @return HasMany
     */
    public function activePunishments(): HasMany
    {
        return $this->hasMany(Punishment::class, 'guild_user_id', 'id')
            ->where(function ($query) {
                $query->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            })
            ->latest();
    }

    public function holidays(): HasMany
    {
        return $this->hasMany(Holiday::class)->withTrashed();
    }

    public function activeHoliday(): HasOne
    {
        return $this->hasOne(Holiday::class)->where('ended_at', '>', now());
    }

    /**
     * @param Builder $query
     * @return Builder
     */
    public function scopeAccepted(Builder $query): Builder
    {
        return $query->whereNotNull('accepted_at')->whereNotNull('added_by');
    }

    public function duty(): array
    {
        $current_duty = $this->currentDuty;
        $now = now();

        if (empty($current_duty)) {
            $current_duty = $this->duties()->create([
                'guild_user_id' => $this->id,
                'user_id' => $this->user_id,
                'guild_id' => $this->guild_id,
                'started_at' => $now,
                'status' => DutyStatusEnum::CURRENT_PERIOD,
            ]);

            ActivityLog::make($this->guild_id, $this->user_id, null, ActionTypeEnum::ON_DUTY);

            return ['duty_model' => $current_duty, 'duty_action' => DutyActionEnum::ON_DUTY];
        }

        $diff_in_minutes = $current_duty->started_at->diffInMinutes($now);
        if ($diff_in_minutes > 0) {
            $current_duty->update([
                'finished_at' => $now,
                'value' => $diff_in_minutes,
            ]);

            ActivityLog::make($this->guild_id, $this->user_id, null, ActionTypeEnum::OFF_DUTY);

            return ['duty_model' => $current_duty, 'duty_action' => DutyActionEnum::OFF_DUTY];
        } else {
            return ['duty_model' => $current_duty, 'duty_action' => null];
        }
    }

    /**
     * @return array
     */
    public function getPermissionsAttribute(): array
    {
        return Cache::rememberForever("guild_{$this->guild_id}_user_{$this->user_id}_permissions", function () {
            return GuildRole::where('guild_id', $this->guild_id)
                ->whereIn('role_id', $this->cached_roles ?? [])
                ->pluck('permissions')
                ->flatten()
                ->unique()
                ->toArray();
        });
    }
}
