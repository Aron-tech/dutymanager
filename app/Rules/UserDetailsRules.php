<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Translation\PotentiallyTranslatedString;

class UserDetailsRules implements ValidationRule
{
    public static function rules(string $prefix = 'settings.user_details'): array
    {
        return [
            "{$prefix}.require_real_name" => ['nullable', 'boolean'],
            "{$prefix}.name_format" => ['nullable', 'string'],
            "{$prefix}.log_channel_id" => ['nullable', 'string'],

            "{$prefix}.config" => ['nullable', 'array', new UserDetailsConfigPremiumRule],
            "{$prefix}.config.*.name" => ["required_with:{$prefix}.config", 'string'],
            "{$prefix}.config.*.type" => ["required_with:{$prefix}.config", 'string', 'in:int,string,boolean'],
            "{$prefix}.config.*.required" => ["required_with:{$prefix}.config", 'boolean'],
        ];
    }

    public static function messages(string $prefix = 'settings.user_details'): array
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
