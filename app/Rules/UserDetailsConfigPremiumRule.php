<?php

namespace App\Rules;

use App\Models\LicenseKey;
use App\Services\SelectedGuildService;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class UserDetailsConfigPremiumRule implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_array($value)) {
            return;
        }

        if (count($value) <= 3) {
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
            $fail(__('Több mint 3 mező felvételéhez prémium előfizetés szükséges!'));
        }
    }
}
