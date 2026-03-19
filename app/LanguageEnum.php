<?php

namespace App;

enum LanguageEnum: string
{
    case English = 'en';
    case Hungarian = 'hu';

    /**
     * @return array
     */
    public static function getOptions(): array
    {
        return array_column(self::cases(), 'value');
    }

    /**
     * @return array
     */
    public static function getTranslatedOptions(): array
    {
        $options = [];
        foreach (self::cases() as $role) {
            $options[$role->value] = $role->getLabel();
        }

        return $options;
    }

    /**
     * @param string|null $lang
     * @return string
     */
    public function getLabel(?string $lang = null): string
    {
        return match ($this) {
            self::English => __('enum.english', [], $lang),
            self::Hungarian => __('enum.hungarian', [], $lang),
        };
    }
}
