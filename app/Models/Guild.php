<?php

namespace App\Models;

use App\Concerns\DataTrait;
use App\Enums\DutyStatusEnum;
use App\Enums\FeatureEnum;
use Database\Factories\GuildFactory;
use Illuminate\Contracts\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Cache;

#[Fillable(['id', 'name', 'icon', 'owner_id', 'lang_code', 'is_installed', 'data'])]
#[Hidden(['lang_code'])]
class Guild extends Model
{
    /** @use HasFactory<GuildFactory> */
    use DataTrait, HasFactory, SoftDeletes;

    public const string ROLE_WHITELIST_CACHE_PREFIX = 'guild_role_whitelist:';

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
            'data' => 'array',
        ];
    }

    public static function deleteRoleWhitelistCache(string $guild_id): void
    {
        Cache::forget(self::ROLE_WHITELIST_CACHE_PREFIX.$guild_id);
    }

    /**
     * Role IDs worth persisting into guild_users.cached_roles (permission roles + rank roles).
     * An empty result is never cached, so an uninstalled/unconfigured guild doesn't stay blank for an hour.
     *
     * @return list<string>
     */
    public function getRoleWhitelist(): array
    {
        $cache_key = self::ROLE_WHITELIST_CACHE_PREFIX.$this->id;
        $whitelist = Cache::get($cache_key);

        if ($whitelist !== null) {
            return $whitelist;
        }

        $guild_role_ids = $this->guildRoles()->pluck('role_id')->map(fn ($id) => (string) $id)->all();
        $rank_role_ids = [];
        $guild_settings = $this->guildSettings;

        if ($guild_settings?->isEnabledFeature(FeatureEnum::RANK)) {
            $rank_role_ids = $guild_settings->getFeatureSettings(FeatureEnum::RANK, 'rank_roles', []);
        }

        $whitelist = array_values(array_unique(array_merge($guild_role_ids, $rank_role_ids)));

        if ($whitelist !== []) {
            Cache::put($cache_key, $whitelist, now()->addHour());
        }

        return $whitelist;
    }

    public function guildSettings(): HasOne
    {
        return $this->hasOne(GuildSettings::class, 'guild_id', 'id');
    }

    public function guildUsers(): HasMany
    {
        return $this->hasMany(GuildUser::class);
    }

    public function acceptedGuildUsers(): HasMany
    {
        return $this->hasMany(GuildUser::class)->whereNotNull('accepted_at');
    }

    public function users(): HasManyThrough
    {
        return $this->hasManyThrough(User::class, GuildUser::class);
    }

    public function duties(): HasMany
    {
        return $this->hasMany(Duty::class);
    }

    public function guildDuties(): HasManyThrough
    {
        return $this->hasManyThrough(Duty::class, GuildUser::class, 'guild_id', 'guild_user_id', 'id', 'id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(Item::class);
    }

    public function guildRoles(): HasMany
    {
        return $this->hasMany(GuildRole::class);
    }

    public function activeLicenseKey(): HasOne
    {
        return $this->hasOne(LicenseKey::class)
            ->whereNotNull('used_at')
            ->where(function (Builder $query): void {
                $query->where('plan_type', 'lifetime')
                    ->orWhere('used_at', '>', now()->subYear());
            });
    }

    public function hasActiveLicenseKey(): bool
    {
        return $this->activeLicenseKey()->exists();
    }

    public function activeSubscription(): HasOne
    {
        return $this->hasOne(Subscription::class)
            ->where(function ($query): void {
                $query->whereNull('ends_at')
                    ->orWhere('ends_at', '>', now());
            });
    }

    public function hasActiveSubscription(): bool
    {
        return $this->activeSubscription()->exists();
    }

    public function punishments(): HasMany
    {
        return $this->hasMany(Punishment::class);
    }

    public function scopeInstalled(Builder $query): Builder
    {
        return $query->where('is_installed', true);
    }

    public function getDutiesValue(DutyStatusEnum $status = DutyStatusEnum::CURRENT_PERIOD): int
    {
        return $this->duties()->where('status', '<=', $status)->sum('value');
    }

    public function exams(): HasMany
    {
        return $this->hasMany(Exam::class);
    }
}
