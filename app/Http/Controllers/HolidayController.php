<?php

namespace App\Http\Controllers;

use App\Models\Holiday;
use App\Services\HolidayService;
use Throwable;

class HolidayController extends Controller
{
    public function __construct(private readonly HolidayService $service) {}

    public function delete(Holiday $holiday)
    {
        try {

        } catch (Throwable) {

        }
    }
}
