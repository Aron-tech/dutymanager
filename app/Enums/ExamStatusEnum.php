<?php

namespace App\Enums;

enum ExamStatusEnum: int
{
    case UNDER_FILLING = 0;
    case PENDING = 1;
    case GRADED = 2;

    /**
     * @return array
     */
    public static function getOptions(): array
    {
        return array_column(self::cases(), 'value');
    }
}
