<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['guild_id', 'role_id', 'permissions'])]
class GuildRole extends Model
{
    /**
     * @return string[]
     */
    protected function casts(): array
    {
        return [
            'permissions' => 'array',
        ];
    }
}
