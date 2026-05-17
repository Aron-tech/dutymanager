<?php

namespace App\Rules;

use App\Models\LicenseKey;
use App\Services\SelectedGuildService;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class HasPremium implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (empty($value)) {
            return;
        }

        $guild = SelectedGuildService::get();

        if (! $guild) {
            return;
        }

        $has_premium = LicenseKey::where('guild_id', $guild->id)
            ->get()
            ->filter(fn ($lic) => $lic->is_active)
            ->isNotEmpty();

        if (! $has_premium) {
            $fail(__('Prémium szükséges ehhez a funkcióhoz!'));
        }
    }
}
