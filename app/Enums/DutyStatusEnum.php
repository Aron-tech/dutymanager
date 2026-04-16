<?php

namespace App\Enums;

enum DutyStatusEnum: int
{
    case CURRENT_PERIOD = 0;
    case ALL_PERIOD = 1;

    /**
     * @return array
     */
    public static function getOptions(): array
    {
        return array_column(self::cases(), 'value');
    }
}
