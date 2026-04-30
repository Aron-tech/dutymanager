<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Translation\PotentiallyTranslatedString;

class UserDetailsRules implements ValidationRule
{
    public static function rules(): array
    {
        return [
            'settings.user_details' => ['required', 'array'],
            'settings.user_details.require_real_name' => ['nullable', 'boolean'],
            'settings.user_details.name_format' => ['nullable', 'string'],
            'settings.user_details.log_channel_id' => ['nullable', 'string'],
            'settings.user_details.config' => ['nullable', 'array'],
        ];
    }

    public static function messages(): array
    {
        return [];
    }

    /**
     * Run the validation rule.
     *
     * @param  Closure(string, ?string=): PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        //
    }
}
