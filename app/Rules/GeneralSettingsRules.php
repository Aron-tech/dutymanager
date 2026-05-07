<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Translation\PotentiallyTranslatedString;

class GeneralSettingsRules implements ValidationRule
{
    public static function rules(string $prefix = 'settings.general'): array
    {
        return [
            "{$prefix}.lang" => ['required', 'string'],
            "{$prefix}.default_role" => ['required', 'string'],
            "{$prefix}.mode" => ['required', 'in:preset,custom'],
            "{$prefix}.subscription_id" => ['nullable', 'string'],
            "{$prefix}.preset_roles.user" => ["exclude_unless:{$prefix}.mode,preset", 'required', 'array', 'min:1'],
            "{$prefix}.preset_roles.user.*" => ['string'],
            "{$prefix}.preset_roles.staff" => ["exclude_unless:{$prefix}.mode,preset", 'required', 'array', 'min:1'],
            "{$prefix}.preset_roles.staff.*" => ['string'],
            "{$prefix}.preset_roles.owner" => ["exclude_unless:{$prefix}.mode,preset", 'required', 'array', 'min:1'],
            "{$prefix}.preset_roles.owner.*" => ['string'],
            "{$prefix}.role_permissions" => ["exclude_unless:{$prefix}.mode,custom", 'required', 'array', 'min:1'],
        ];
    }

    public static function messages(string $prefix = 'settings.general'): array
    {
        return [
            "{$prefix}.lang.required" => __('A szerver nyelvének kiválasztása kötelező.'),
            "{$prefix}.default_role.required" => __('Az alapértelmezett rang kiválasztása kötelező.'),
            "{$prefix}.preset_roles.user.required" => __('Az Alapértelmezett rang kiválasztása kötelező egyszerű módban.'),
            "{$prefix}.preset_roles.user.min" => __('Legalább egy Alapértelmezett rangot ki kell választani.'),
            "{$prefix}.preset_roles.staff.required" => __('A Moderátor rang kiválasztása kötelező egyszerű módban.'),
            "{$prefix}.preset_roles.staff.min" => __('Legalább egy Moderátor rangot ki kell választani.'),
            "{$prefix}.preset_roles.owner.required" => __('A Tulajdonos rang kiválasztása kötelező egyszerű módban.'),
            "{$prefix}.preset_roles.owner.min" => __('Legalább egy Tulajdonos rangot ki kell választani.'),
            "{$prefix}.role_permissions.required" => __('Haladó módban legalább egy jogosultságot ki kell osztani!'),
            "{$prefix}.role_permissions.min" => __('Haladó módban legalább egy jogosultságot ki kell osztani!'),
        ];
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
