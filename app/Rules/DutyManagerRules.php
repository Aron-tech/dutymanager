<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class DutyManagerRules implements ValidationRule
{
    public static function rules(string $prefix = 'settings.duty_manager'): array
    {
        return [
            "{$prefix}.duty_role_id" => ['required', 'string'],
            "{$prefix}.duty_panel_channel_id" => ['required', 'string'],
            "{$prefix}.duty_voice_channel_id" => ['nullable', 'string', new HasPremium()],
            "{$prefix}.active_duty_channel_id" => ['nullable', 'string'],
        ];
    }

    public static function messages(string $prefix = 'settings.duty_manager'): array
    {
        return [
            "{$prefix}.duty_role_id.required" => __('A Duty rang kiválasztása kötelező!'),
            "{$prefix}.duty_panel_channel_id.required" => __('A Duty panel csatorna kiválasztása kötelező!'),
        ];
    }

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        // TODO: Implement validate() method.
    }
}
