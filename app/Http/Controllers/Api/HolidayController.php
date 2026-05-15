<?php

namespace App\Http\Controllers\Api;

use App\Enums\PermissionEnum;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreHolidayRequest;
use App\Services\HolidayService;

class HolidayController extends Controller
{
    public function __construct(private readonly HolidayService $service) {}

    public function store(StoreHolidayRequest $request)
    {
        if (auth()->user()->cannot(PermissionEnum::GET_HOLIDAY)) {
            abort(403, __('app.error.no_permission'));
        }

        $data = $request->validated();

        return response()->json($this->service->store($data));

    }
}
