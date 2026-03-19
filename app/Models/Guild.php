<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['id', 'name', 'slug', 'owner_id', 'lang_code', 'is_installed'])]
#[Hidden(['slug', 'lang_code'])]
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
     * @return HasManyThrough
     */
    public function users(): HasManyThrough
    {
        return $this->hasManyThrough(User::class, GuildUser::class);
    }
}
