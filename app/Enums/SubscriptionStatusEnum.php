<?php

namespace App\Enums;

enum SubscriptionStatusEnum: string
{
    case ACTIVE = 'active';
    case CANCELLED = 'cancelled';
    case PAST_DUE = 'past_due';

    /**
     * @return array
     */
    public static function getOptions(): array
    {
        return array_column(self::cases(), 'value');
    }
}
