<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Translation\PotentiallyTranslatedString;

class DutyManagerRules implements ValidationRule
{
    public static function rules(): array
    {
        return [
            'settings.duty_manager' => ['required', 'array'],
            'settings.duty_manager.duty_role_id' => ['required', 'string'],
            'settings.duty_manager.duty_panel_channel_id' => ['required', 'string'],
            'settings.duty_manager.duty_voice_channel_id' => ['nullable', 'string'],
            'settings.duty_manager.active_duty_channel_id' => ['nullable', 'string'],
            'settings.duty_manager.duty_log_channel_id' => ['required', 'string'],
        ];
    }

    public static function messages(): array
    {
        return [
            'settings.duty_manager.duty_role_id.required' => __('A Duty rang kiválasztása kötelező!'),
            'settings.duty_manager.duty_panel_channel_id.required' => __('A Duty panel csatorna kiválasztása kötelező!'),
            'settings.duty_manager.duty_log_channel_id.required' => __('A Duty log csatorna kiválasztása kötelező!'),
        ];
    }

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        // TODO: Implement validate() method.
    }
}
