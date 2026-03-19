<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['guild_id', 'features', 'feature_settings', 'user_details_config'])]
class GuildSettings extends Model
{
    protected $table = 'guild_settings';
    protected $primaryKey = 'guild_id';
    protected $keyType = 'string';
    public $incrementing = false;

    /**
     * @return string[]
     */
    protected function casts(): array
    {
        return [
            'features' => 'array',
            'feature_settings' => 'array',
            'user_details_config' => 'array',
        ];
    }

    /**
     * @return BelongsTo
     */
    public function guild(): BelongsTo
    {
        return $this->belongsTo(Guild::class, 'guild_id', 'guild_id');
    }

}
