<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Translation\PotentiallyTranslatedString;

class GeneralSettingsRules implements ValidationRule
{
    public static function rules(): array
    {
        return [
            'settings.general' => ['required', 'array'],
            'settings.general.lang' => ['required', 'string'],
            'settings.general.mode' => ['required', 'in:preset,custom'],
            'settings.general.subscription_id' => ['nullable', 'string'],
            'settings.general.preset_roles.user' => ['exclude_unless:settings.general.mode,preset', 'required', 'array', 'min:1'],
            'settings.general.preset_roles.user.*' => ['string'],
            'settings.general.preset_roles.staff' => ['exclude_unless:settings.general.mode,preset', 'required', 'array', 'min:1'],
            'settings.general.preset_roles.staff.*' => ['string'],
            'settings.general.preset_roles.owner' => ['exclude_unless:settings.general.mode,preset', 'required', 'array', 'min:1'],
            'settings.general.preset_roles.owner.*' => ['string'],
            'settings.general.role_permissions' => ['exclude_unless:settings.general.mode,custom', 'required', 'array', 'min:1'],
        ];
    }

    public static function messages(): array
    {
        return [
            'settings.general.preset_roles.user.required' => __('Az Alapértelmezett rang kiválasztása kötelező egyszerű módban.'),
            'settings.general.preset_roles.user.min' => __('Legalább egy Alapértelmezett rangot ki kell választani.'),
            // ...
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
