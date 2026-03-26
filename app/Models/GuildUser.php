<?php

namespace App\Models;

use App\DutyStatusEnum;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['user_id', 'guild_id', 'ic_name', 'details', 'is_request', 'accepted_at', 'added_by', 'cached_roles', 'roles_last_synced'])]
#[Hidden(['cached_roles', 'roles_last_synced'])]
class GuildUser extends Model
{
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
        ];
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
     * @return HasMany
     */
    public function duties(): HasMany
    {
        return $this->hasMany(Duty::class);
    }

    /**
     * @param DutyStatusEnum $status
     * @return int
     */
    public function getDutiesValue(DutyStatusEnum $status = DutyStatusEnum::CURRENT_PERIOD): int
    {
        return Duty::where('guild_user_id', $this->id)->where('status', '<=', $status)->sum('value');
    }
}
