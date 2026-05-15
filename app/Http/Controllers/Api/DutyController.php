<?php

namespace App\Http\Controllers\Api;

use App\Concerns\ServiceTrait;
use App\Enums\DutyStatusEnum;
use App\Enums\PermissionEnum;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\ResetDutyRequest;
use App\Http\Requests\Api\StoreDutyRequest;
use App\Models\GuildUser;
use App\Services\DutyService;
use App\Services\SelectedGuildService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use phpDocumentor\Reflection\DocBlock\Tags\See;
use Throwable;

class DutyController extends Controller
{
    use ServiceTrait;

    public function __construct(private readonly DutyService $service) {}

    public function store(StoreDutyRequest $request): JsonResponse
    {
        if (auth()->user()->cannot(PermissionEnum::ADD_DUTIES)) {
            abort(403, __('app.error.no_permission'));
        }

        $data = $request->validated();
        try {
            $guild_user = GuildUser::where('guild_id', $data['guild_id'])->where('user_id', $data['user_id'])->accepted()->firstOrFail();

            $this->service->storeDuty($data, $guild_user);

            return response()->json($this->makeResponse(true, null, __('duty.success_duty_add')));
        } catch (Throwable $e) {
            Log::error($e->getMessage());

            return response()->json($this->makeResponse(false, null, __('app.error_action')));
        }
    }

    public function reset(ResetDutyRequest $request): JsonResponse
    {
        if (auth()->user()->cannot(PermissionEnum::EDIT_DUTIES)) {
            abort(403, __('app.error.no_permission'));
        }

        $data = $request->validated();
        $guild = SelectedGuildService::get();

        try {
            $query = $guild->duties()->finishedDuties()->where('status', DutyStatusEnum::CURRENT_PERIOD);

            if (isset($data['user_id'])) {
                $query->where('user_id', $data['user_id']);
            }

            $updated_count = $query->update(['status' => DutyStatusEnum::ALL_PERIOD]);

            if ($updated_count > 0) {
                return response()->json($this->makeResponse(true, null, __('duty.success_duty_update_status')));
            }

            return response()->json($this->makeResponse(false, null, __('app.error_action')));
        } catch (Throwable $e) {
            Log::error($e->getMessage());

            return response()->json($this->makeResponse(false, null, __('app.error_action')));
        }
    }
}
