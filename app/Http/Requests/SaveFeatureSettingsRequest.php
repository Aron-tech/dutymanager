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

        if ($this->route('feature_id') === 'general_settings') {
            $rules = array_merge($rules, [
                'settings.language' => ['required', 'string'],

                'settings.preset_roles.user' => ['required_if:settings.mode,preset', 'string'],
                'settings.preset_roles.staff' => ['required_if:settings.mode,preset', 'string'],
                'settings.preset_roles.owner' => ['required_if:settings.mode,preset', 'string'],

                'settings.role_permissions' => ['required_if:settings.mode,custom', 'array', 'min:1'],
            ]);
        }

        return $rules;
    }

    public function messages(): array
    {
        return [
            'settings.language.required' => 'A nyelv kiválasztása kötelező.',
            'settings.preset_roles.*.required_if' => 'Ennek a rangnak a kiválasztása kötelező a Preset módban.',
            'settings.role_permissions.required_if' => 'Legalább egy jogosultságot ki kell osztani!',
            'settings.role_permissions.min' => 'Legalább egy jogosultságot ki kell osztani!',
        ];
    }
}
