<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

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
