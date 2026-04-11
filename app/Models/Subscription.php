<?php

namespace App\Models;

use App\SubscriptionStatusEnum;
use Illuminate\Console\Attributes\Hidden;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'guild_id', 'stripe_id', 'status', 'current_period_end'])]
#[Hidden(['stripe_id'])]
class Subscription extends Model
{
    protected $table = 'subscriptions';
    protected $casts = [
        'status' => SubscriptionStatusEnum::class,
        'current_period_end' => 'datetime',
    ];

    /**
     * @return BelongsTo
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return BelongsTo
     */
    public function guild(): BelongsTo
    {
        return $this->belongsTo(Guild::class);
    }
}
