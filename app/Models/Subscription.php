<?php

namespace App\Models;

use Illuminate\Console\Attributes\Hidden;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Laravel\Cashier\Subscription as CashierSubscription;

#[Fillable(['user_id', 'guild_id', 'type', 'stripe_id', 'stripe_status', 'stripe_price', 'quantity', 'trial_ends_at', 'ends_at', 'guild_last_changed_at'])]
#[Hidden(['stripe_id'])]
class Subscription extends CashierSubscription
{
    protected $casts = [
        'trial_ends_at' => 'datetime',
        'ends_at' => 'datetime',
        'guild_last_changed_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function guild(): BelongsTo
    {
        return $this->belongsTo(Guild::class);
    }

    /**
     * Check if the guild can be changed.
     */
    public function canChangeGuild(): bool
    {
        if (! $this->guild_last_changed_at) {
            return true;
        }

        return $this->guild_last_changed_at->addMonth()->isPast();
    }

    /**
     * Set a new guild for the subscription.
     */
    public function changeGuild(string $guildId): bool
    {
        if (! $this->canChangeGuild()) {
            return false;
        }

        $this->update([
            'guild_id' => $guildId,
            'guild_last_changed_at' => now(),
        ]);

        return true;
    }
}
