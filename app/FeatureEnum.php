<?php

namespace App;

enum FeatureEnum: string
{
    case DUTY = 'duty';

    /**
     * @return array
     */
    public static function getOptions(): array
    {
        return array_column(self::cases(), 'value');
    }
}
