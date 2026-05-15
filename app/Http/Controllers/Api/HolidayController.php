<?php

namespace App\Http\Controllers\Api;

use App\Enums\PermissionEnum;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\DeleteHolidayRequest;
use App\Http\Requests\Api\StoreHolidayRequest;
use App\Services\HolidayService;
use App\Services\SelectedGuildService;
use Illuminate\Http\JsonResponse;

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

    public function delete(DeleteHolidayRequest $request): JsonResponse
    {
        if (auth()->user()->cannot(PermissionEnum::CANCEL_HOLIDAY)) {
            abort(403, __('app.error.no_permission'));
        }

        $data = $request->validated();
        $guild = SelectedGuildService::get();
        $guild_user = $guild->acceptedGuildUsers()->where('user_id', $data['user_id'])->with(['activeHoliday'])->first();
        if (! $guild_user) {
            return response()->json($this->service->makeResponse(false, null, 'guild_user.error_not_found_user'));
        }

        $holiday = $guild_user->activeHoliday;

        if (! $holiday) {
            return response()->json($this->service->makeResponse(false, null, 'holiday.error_no_active_holiday'));
        }

        if ($this->service->delete($holiday, $guild)) {
            return response()->json($this->service->makeResponse(true, null, 'holiday.success_cancel_holiday'));
        }

        return response()->json($this->service->makeResponse(false, null, 'app.error_action'));
    }
}
