<?php

namespace App\Enums;

enum ItemTypeEnum: string
{
    case VEHICLE = 'vehicle';
    case CLOTHING = 'clothing';

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
