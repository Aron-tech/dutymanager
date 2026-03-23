<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

#[Fillable(['id', 'name', 'global_name', 'email', 'avatar_url', 'lang_code', 'access_token', 'refresh_token', 'access_expires_at'])]
#[Hidden(['access_token', 'refresh_token', 'access_expires_at'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, SoftDeletes;
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
        ];
    }

    /**
     * @return HasMany
     */
    public function guildUsers(): HasMany
    {
        return $this->hasMany(GuildUser::class);
    }

    /**
     * @return HasManyThrough
     */
    public function guilds(): HasManyThrough
    {
        return $this->hasManyThrough(Guild::class, GuildUser::class);
    }
}
