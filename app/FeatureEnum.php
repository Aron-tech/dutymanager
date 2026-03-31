<?php

namespace App;

enum FeatureEnum: string
{
    case DUTY = 'duty_manager';

    public static function getOptions(): array
    {
        return array_column(self::cases(), 'value');
    }

    /**
     * @return string
     */
    public function getName(): string
    {
        return match ($this) {
            self::DUTY => 'Szolgálat Kezelő',
        };
    }

    /**
     * @return string
     */
    public function getDescription(): string
    {
        return match ($this) {
            self::DUTY => 'Frakciók és szolgálati idők naplózása.',
        };
    }
}
