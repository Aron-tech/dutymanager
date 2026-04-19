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
}
