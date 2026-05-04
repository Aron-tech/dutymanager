<?php

namespace App\Enums;

enum FeatureEnum: string
{
    case DUTY = 'duty_manager';
    case WARN = 'warning_system';
    case RANK = 'rank_system';

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
            self::WARN => 'Figyelmeztetés rendszer',
            self::RANK => 'Rang rendszer',
        };
    }

    /**
     * @return string
     */
    public function getDescription(): string
    {
        return match ($this) {
            self::DUTY => 'Frakciók és szolgálati idők naplózása.',
            self::WARN => 'Figyelmeztetés rendszer',
            self::RANK => 'Rang rendszer',
        };
    }
}
