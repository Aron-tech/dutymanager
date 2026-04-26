<?php

namespace App\Enums;

enum DutyActionEnum: string
{
    case CANCEL_DUTY = 'cancel_duty';
    case OFF_DUTY = 'off_duty';
    case ON_DUTY = 'on_duty';
}
