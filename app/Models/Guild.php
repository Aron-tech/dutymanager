<?php

namespace App\Models;

use App\Enums\DutyStatusEnum;
use Illuminate\Contracts\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['id', 'name', 'icon', 'owner_id', 'lang_code', 'is_installed'])]
#[Hidden(['lang_code'])]
class Guild extends Model
{
    use SoftDeletes;

    protected $primaryKey = 'id';

    protected $keyType = 'string';

    public $incrementing = false;

    /**
     * @return string[]
     */
    protected function casts(): array
    {
        return [
            'is_installed' => 'bool',
        ];
    }

    /**
     * @return HasOne
     */
    public function guildSettings(): HasOne
    {
        return $this->hasOne(GuildSettings::class, 'guild_id', 'id');
    }

    /**
     * @return HasMany
     */
    public function guildUsers(): HasMany
    {
        return $this->hasMany(GuildUser::class);
    }

    /**
     * @return HasMany
     */
    public function acceptedGuildUsers(): HasMany
    {
        return $this->hasMany(GuildUser::class)->whereNotNull('accepted_at');
    }

    /**
     * @return HasManyThrough
     */
    public function users(): HasManyThrough
    {
        return $this->hasManyThrough(User::class, GuildUser::class);
    }

    /**
     * @return HasManyThrough
     */
    public function guildDuties(): HasManyThrough
    {
        return $this->hasManyThrough(Duty::class, GuildUser::class, 'guild_id', 'guild_user_id', 'id', 'id');
    }

    /**
     * @return HasMany
     */
    public function items(): HasMany
    {
        return $this->hasMany(Item::class);
    }

    /**
     * @return HasMany
     */
    public function guildRoles(): HasMany
    {
        return $this->hasMany(GuildRole::class);
    }

    /**
     * @param Builder $query
     * @return Builder
     */
    public function scopeInstalled(Builder $query): Builder
    {
        return $query->where('is_installed', true);
    }

    /**
     * @param DutyStatusEnum $status
     * @return int
     */
    public function getDutiesValue(DutyStatusEnum $status = DutyStatusEnum::CURRENT_PERIOD): int
    {
        return $this->guildDuties()->where('status', '<=', $status)->sum('value');
    }
}
