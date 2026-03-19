<?php

namespace App\Models;

use App\ActionTypeEnum;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['guild_id', 'user_id', 'target_id', 'action', 'details', 'created_at'])]
class ActivityLog extends Model
{
    public $timestamps = false;

    protected function casts(): array
    {
        return [
            'action' => ActionTypeEnum::class,
            'details' => 'json',
            'created_at' => 'datetime',
        ];
    }

    /**
     * @param string|null $guild_id
     * @param string|null $user_id
     * @param string|null $target_id
     * @param ActionTypeEnum $action
     * @param array|null $details
     * @return void
     */
    public static function make(?string $guild_id, ?string $user_id, ?string $target_id, ActionTypeEnum $action, ?array $details = null): void
    {
        $activity_log = new self;
        $activity_log->guild_id = $guild_id;
        $activity_log->user_id = $user_id;
        $activity_log->target_id = $target_id;
        $activity_log->action = $action;
        $activity_log->details = $details;
        $activity_log->created_at = now();
        $activity_log->save();
    }
}
