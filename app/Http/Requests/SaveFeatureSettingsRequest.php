<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SaveFeatureSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $rules = [
            'settings' => ['required', 'array'],
            'next_view' => ['required', 'string', 'min:1', 'max:255'],
        ];

        $featureId = $this->route('feature_id');

        if ($featureId === 'general_settings') {
            $rules = array_merge($rules, [
                'settings.lang' => ['required', 'string'],
                'settings.default_role' => ['required', 'string'],
                'settings.mode' => ['required', 'in:preset,custom'],
                'settings.subscription_id' => ['nullable', 'string'],

                // JAVÍTVA: A Preset rangok most már TÖMBÖK, és legalább 1 elemet tartalmazniuk kell!
                'settings.preset_roles.user' => ['exclude_unless:settings.mode,preset', 'required', 'array', 'min:1'],
                'settings.preset_roles.user.*' => ['string'],

                'settings.preset_roles.staff' => ['exclude_unless:settings.mode,preset', 'required', 'array', 'min:1'],
                'settings.preset_roles.staff.*' => ['string'],

                'settings.preset_roles.owner' => ['exclude_unless:settings.mode,preset', 'required', 'array', 'min:1'],
                'settings.preset_roles.owner.*' => ['string'],

                // A Custom módnál a jogosultságok tömbje
                'settings.role_permissions' => ['exclude_unless:settings.mode,custom', 'required', 'array', 'min:1'],
            ]);
        } elseif ($featureId === 'duty_manager') {
            $rules = array_merge($rules, [
                'settings.duty_role_id' => ['required', 'string'],
                'settings.duty_panel_channel_id' => ['required', 'string'],
                'settings.duty_voice_channel_id' => ['nullable', 'string'],
                'settings.active_duty_channel_id' => ['nullable', 'string'],
                'settings.duty_log_channel_id' => ['required', 'string'],
            ]);
        } elseif ($featureId === 'warning_system') {
            $rules = array_merge($rules, [
                'settings.warning_roles' => ['required', 'array', 'min:1'],
                'settings.warning_roles.*' => ['string'],
                'settings.warning_channel_id' => ['required', 'string'],
                'settings.auto_expire_days' => ['nullable', 'integer', 'min:1'],
            ]);
        } elseif ($featureId === 'rank_system') {
            $rules = array_merge($rules, [
                'settings.ordered_ranks' => ['required', 'array', 'min:2'], // Legalább 2 rang kell a létrához
                'settings.ordered_ranks.*' => ['string'],
                'settings.announcement_channel_id' => ['nullable', 'string'],
            ]);
        } elseif ($featureId === 'user_details') {
            $rules = array_merge($rules, [
                'settings.require_real_name' => ['nullable', 'boolean'],
                'settings.name_format' => ['nullable', 'string'],
                'settings.log_channel_id' => ['nullable', 'string'],
                'settings.config' => ['nullable', 'array'],
            ]);
        }

        return $rules;
    }

    public function messages(): array
    {
        return [
            'settings.required' => __('Kérlek, konfiguráld a beállításokat.'),
            'settings.lang.required' => __('A szerver nyelvének kiválasztása kötelező.'),
            'settings.default_role.required' => __('Az alapértelmezett rang kiválasztása kötelező.'),

            // Mivel a required_if le lett cserélve exclude_unless-re, itt a sima "required" és "min" üzeneteket kell megadnunk
            'settings.preset_roles.user.required' => __('Az Alapértelmezett rang kiválasztása kötelező egyszerű módban.'),
            'settings.preset_roles.user.min' => __('Legalább egy Alapértelmezett rangot ki kell választani.'),

            'settings.preset_roles.staff.required' => __('A Moderátor rang kiválasztása kötelező egyszerű módban.'),
            'settings.preset_roles.staff.min' => __('Legalább egy Moderátor rangot ki kell választani.'),

            'settings.preset_roles.owner.required' => __('A Tulajdonos rang kiválasztása kötelező egyszerű módban.'),
            'settings.preset_roles.owner.min' => __('Legalább egy Tulajdonos rangot ki kell választani.'),

            'settings.role_permissions.required' => __('Haladó módban legalább egy jogosultságot ki kell osztani!'),
            'settings.role_permissions.min' => __('Haladó módban legalább egy jogosultságot ki kell osztani!'),

            // Modulok egyedi hibaüzenetei
            'settings.duty_role_id.required' => __('A Duty rang kiválasztása kötelező!'),
            'settings.duty_panel_channel_id.required' => __('A Duty panel csatorna kiválasztása kötelező!'),
            'settings.duty_log_channel_id.required' => __('A Duty log csatorna kiválasztása kötelező!'),

            'settings.warning_roles.required' => __('Legalább egy rangot ki kell választani, aki oszthat figyelmeztetést!'),
            'settings.warning_roles.min' => __('Legalább egy rangot ki kell választani, aki oszthat figyelmeztetést!'),
            'settings.warning_channel_id.required' => __('A figyelmeztetések csatornájának kiválasztása kötelező!'),

            'settings.ordered_ranks.required' => __('A ranglétra felépítése kötelező!'),
            'settings.ordered_ranks.min' => __('A ranglétrának legalább 2 rangból kell állnia!'),
        ];
    }
}
