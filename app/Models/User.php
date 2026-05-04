<?php

namespace App\Models;

use App\Enums\GlobalRoleEnum;
use App\Enums\LanguageEnum;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Cashier\Billable;

#[Fillable(['id', 'name', 'global_name', 'email', 'avatar_url', 'lang_code', 'access_token', 'refresh_token', 'access_expires_at'])]
#[Hidden(['access_token', 'refresh_token', 'access_expires_at'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use Billable, HasFactory, Notifiable, SoftDeletes;

    protected $primaryKey = 'id';

    protected $keyType = 'string';

    public $incrementing = false;

    /**
     * @return string[]
     */
    protected function casts(): array
    {
        return [
            'access_expires_at' => 'datetime',
            'global_role' => GlobalRoleEnum::class,
            'lang_code' => LanguageEnum::class,
        ];
    }

    public function guildUsers(): HasMany
    {
        return $this->hasMany(GuildUser::class);
    }

    public function guildUser(string $guild_id): HasOne
    {
        return $this->hasOne(GuildUser::class)->where('guild_id', $guild_id);
    }

    public function guilds(): BelongsToMany
    {
        return $this->belongsToMany(Guild::class, 'guild_users', 'user_id', 'guild_id');
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class)->orderBy('created_at', 'desc');
    }

    public function availableSubscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class)->whereNull('guild_id')->where(function ($query) {
            $query->whereNull('ends_at')->orWhere('ends_at', '>', now());
        });
    }
}
