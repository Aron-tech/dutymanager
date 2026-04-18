<?php

namespace App\Enums;

enum PunishmentTypeEnum: string
{
    case VERBAL_WARNING = 'verbal_warning';
    case WARNING = 'warning';
    case BLACKLIST = 'blacklist';

    /**
     * @return array
     */
    public static function getOptions(): array
    {
        return array_column(self::cases(), 'value');
    }

    /**
     * @param string|null $lang
     * @return string
     */
    public function getLabel(?string $lang = null): string
    {
        return __('enum.'.$this->value, [], $lang);
    }
}
