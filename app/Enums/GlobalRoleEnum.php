<?php

namespace App\Enums;

enum GlobalRoleEnum: string
{
    case DEVELOPER = 'developer';
    case ADMIN = 'admin';
    case USER = 'user';

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
            self::DEVELOPER => __('enum.developer', [], $lang),
            self::ADMIN => __('enum.admin', [], $lang),
            self::USER => __('enum.user', [], $lang),
        };
    }
}
