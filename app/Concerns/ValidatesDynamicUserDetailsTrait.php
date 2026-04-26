<?php

namespace App\Concerns;

use App\Models\Guild;

trait ValidatesDynamicUserDetailsTrait
{
    protected array $dynamic_messages = [];

    protected function getDynamicDetailsRules(Guild $guild): array
    {
        $rules = [];
        $user_details_config = $guild->guildSettings->user_details_config ?? [];

        if (empty($user_details_config)) {
            $rules['details.*'] = ['nullable', 'string'];

            return $rules;
        }

        foreach ($user_details_config as $config) {
            $field_name = $config['name'];
            $rule_key = "details.{$field_name}";

            $field_rules = [];
            $field_rules[] = ($config['required'] ?? false) ? 'required' : 'nullable';

            $field_rules[] = match ($config['type'] ?? 'string') {
                'int' => 'integer',
                'bool' => 'boolean',
                'float' => 'numeric',
                default => 'string',
            };

            $rules[$rule_key] = $field_rules;

            $this->dynamic_messages["{$rule_key}.required"] = "A(z) {$field_name} megadása kötelező.";
            $this->dynamic_messages["{$rule_key}.integer"] = "A(z) {$field_name} csak egész szám lehet.";
            $this->dynamic_messages["{$rule_key}.numeric"] = "A(z) {$field_name} csak szám lehet.";
            $this->dynamic_messages["{$rule_key}.boolean"] = "A(z) {$field_name} logikai érték kell legyen.";
        }

        return $rules;
    }

    protected function getDynamicDetailsMessages(): array
    {
        return $this->dynamic_messages;
    }
}
