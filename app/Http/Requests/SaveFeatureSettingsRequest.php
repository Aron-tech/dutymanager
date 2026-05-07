<?php

namespace App\Http\Requests;

use App\Rules\DutyManagerRules;
use App\Rules\GeneralSettingsRules;
use App\Rules\RankSystemRules;
use App\Rules\UserDetailsRules;
use App\Rules\WarningSystemRules;
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
            $rules = array_merge($rules, GeneralSettingsRules::rules('settings'));
        } elseif ($featureId === 'duty_manager') {
            $rules = array_merge($rules, DutyManagerRules::rules('settings'));
        } elseif ($featureId === 'warning_system') {
            $rules = array_merge($rules, WarningSystemRules::rules('settings'));
        } elseif ($featureId === 'rank_system') {
            $rules = array_merge($rules, RankSystemRules::rules('settings'));
        } elseif ($featureId === 'user_details') {
            $rules = array_merge($rules, UserDetailsRules::rules('settings'));
        }

        return $rules;
    }

    public function messages(): array
    {
        $messages = [
            'settings.required' => __('Kérlek, konfiguráld a beállításokat.'),
        ];

        $featureId = $this->route('feature_id');

        if ($featureId === 'general_settings') {
            $messages = array_merge($messages, GeneralSettingsRules::messages('settings'));
        } elseif ($featureId === 'duty_manager') {
            $messages = array_merge($messages, DutyManagerRules::messages('settings'));
        } elseif ($featureId === 'warning_system') {
            $messages = array_merge($messages, WarningSystemRules::messages('settings'));
        } elseif ($featureId === 'rank_system') {
            $messages = array_merge($messages, RankSystemRules::messages('settings'));
        } elseif ($featureId === 'user_details') {
            $messages = array_merge($messages, UserDetailsRules::messages('settings'));
        }

        return $messages;
    }
}
