<?php

namespace App\Http\Requests;

use App\Rules\DutyManagerRules;
use App\Rules\GeneralSettingsRules;
use App\Rules\UserDetailsRules;
use Illuminate\Foundation\Http\FormRequest;

class UpdateGuildSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $rules = [
            'enabled_features' => ['present', 'array'],
            'enabled_features.*' => ['string'],
            'settings' => ['required', 'array'],
        ];

        $rules = array_merge(
            $rules,
            GeneralSettingsRules::rules(),
            UserDetailsRules::rules()
        );

        $enabled_features = $this->input('enabled_features', []);

        foreach ($enabled_features as $feature) {
            $feature_rules = match ($feature) {
                'duty_manager' => DutyManagerRules::rules(),
                // 'warning_system' => WarningSystemRules::rules(),
                // 'rank_system' => RankSystemRules::rules(),
                default => [],
            };

            $rules = array_merge($rules, $feature_rules);
        }

        return $rules;
    }

    public function messages(): array
    {
        $messages = array_merge(
            GeneralSettingsRules::messages(),
            UserDetailsRules::messages()
        );

        $enabled_features = $this->input('enabled_features', []);

        foreach ($enabled_features as $feature) {
            $feature_messages = match ($feature) {
                'duty_manager' => DutyManagerRules::messages(),
                // 'warning_system' => WarningSystemRules::messages(),
                // 'rank_system' => RankSystemRules::messages(),
                default => [],
            };

            $messages = array_merge($messages, $feature_messages);
        }

        return $messages;
    }
}
