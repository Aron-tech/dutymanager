<?php

namespace App\Models;

use App\Enums\DutyActionEnum;
use App\Enums\DutyStatusEnum;
use App\Services\SelectedGuildService;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\MorphMany;

#[Fillable(['user_id', 'guild_id', 'ic_name', 'details', 'is_request', 'accepted_at', 'added_by', 'cached_roles', 'roles_last_synced', 'rank_changed_at'])]
#[Hidden(['cached_roles', 'roles_last_synced'])]
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
        return $this->hasOne(Duty::class)->where('status', '<=', DutyStatusEnum::CURRENT_PERIOD)->whereNull('finished_at')->latest();
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
        return $this->hasMany(Punishment::class, 'user_id', 'user_id')
            ->when($this->guild_id, function ($query) {
                $query->where('guild_id', $this->guild_id);
            })->withTrashed();
    }

    /**
     * @return HasMany
     */
    public function activePunishments(): HasMany
    {
        return $this->hasMany(Punishment::class, 'user_id', 'user_id')
            ->when($this->guild_id, function ($query) {
                $query->where('guild_id', $this->guild_id);
            })
            ->where(function ($query) {
                $query->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            })
            ->latest();
    }

    public function duty(): array
    {
        $current_duty = $this->currentDuty;
        $now = now();

        if (empty($current_duty)) {
            $current_duty = $this->duties()->create([
                'guild_user_id' => $this->id,
                'started_at' => now(),
                'status' => DutyStatusEnum::CURRENT_PERIOD,
            ]);

            return ['duty_model' => $current_duty, 'duty_action' => DutyActionEnum::ON_DUTY];
        }

        $diff_in_minutes = $current_duty->started_at->diffInMinutes($now);
        if ($diff_in_minutes > 0) {
            $current_duty->update([
                'finished_at' => $now,
                'value' => $diff_in_minutes,
            ]);

            return ['duty_model' => $current_duty, 'duty_action' => DutyActionEnum::OFF_DUTY];
        } else {
            return ['duty_model' => $current_duty, 'duty_action' => null];
        }
    }
}
