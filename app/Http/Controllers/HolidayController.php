<?php

namespace App\Http\Controllers;

use App\Services\HolidayService;

class HolidayController extends Controller
{
    public function __construct(private readonly HolidayService $service) {}
}
