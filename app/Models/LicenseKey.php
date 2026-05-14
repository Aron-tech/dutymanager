<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['key', 'plan_type', 'used_at', 'activated_by', 'guild_id'])]
class LicenseKey extends Model
{
    protected function casts(): array
    {
        return [
            'used_at' => 'datetime',
        ];
    }

    public function guild(): BelongsTo
    {
        return $this->belongsTo(Guild::class);
    }

    public function activatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'activated_by');
    }

    public function getExpiresAtAttribute(): ?Carbon
    {
        if (! $this->used_at || $this->plan_type === 'lifetime') {
            return null;
        }

        return $this->used_at->copy()->addYear();
    }

    public function getIsActiveAttribute(): bool
    {
        if (! $this->used_at) {
            return false;
        }

        if ($this->plan_type === 'lifetime') {
            return true;
        }

        return $this->expires_at && $this->expires_at->isFuture();
    }
}
