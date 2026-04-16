<?php

namespace App\Models;

use App\Enums\DutyStatusEnum;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['guild_user_id', 'value', 'started_at', 'finished_at', 'status'])]
class Duty extends Model
{
    use SoftDeletes;

    public $timestamps = false;

    /**
     * @return string[]
     */
    protected function casts(): array
    {
        return [
            'value' => 'int',
            'started_at' => 'datetime',
            'finished_at' => 'datetime',
            'status' => DutyStatusEnum::class,
        ];
    }
}
