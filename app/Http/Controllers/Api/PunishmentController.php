<?php

namespace App\Http\Controllers\Api;

use App\Enums\PunishmentTypeEnum;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StorePunishmentRequest;
use App\Http\Requests\DeletePunishmentRequest;
use App\Services\PunishmentService;
use App\Services\SelectedGuildService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Throwable;

class PunishmentController extends Controller
{
    public function __construct(private readonly PunishmentService $service) {}

    public function store(StorePunishmentRequest $request)
    {
        $data = $request->validated();
        $type = PunishmentTypeEnum::from($data['type']);

        if (! $this->service->hasPermission($type, 'delete')) {
            abort(403, __('app.error_no_permission'));
        }

        try {
            $punishment = $this->service->create($data);

            return response()->json($this->service->makeResponse(true, $punishment, 'punishment.success_create_punishment'));
        } catch (Throwable $e) {
            Log::error($e);

            return response()->json($this->service->makeResponse(false, null, __('app.error_action')));
        }
    }

    /**
     * @throws Throwable
     */
    public function delete(DeletePunishmentRequest $request): JsonResponse
    {
        $data = $request->validated();
        $type = PunishmentTypeEnum::from($data['type']);

        if (! $this->service->hasPermission($type, 'delete')) {
            abort(403, __('app.error_no_permission'));
        }

        $guild = SelectedGuildService::get();

        $guild_user = $guild->acceptedGuildUsers()->where('user_id', $data['user_id'])->first();

        if (! $guild_user) {
            return response()->json($this->service->makeResponse(false, null, 'guild_user.error_not_found_user'));
        }

        $latest_active_punishment = $guild_user->activePunishments()->where('type', $type)->latest()->first();

        if (! $latest_active_punishment) {
            return response()->json($this->service->makeResponse(false, null, 'punishment.error_no_active_punishment'));
        }

        if ($this->service->delete($latest_active_punishment)) {
            return response()->json($this->service->makeResponse(true, null, 'punishment.success_delete_punishment'));
        }

        return response()->json($this->service->makeResponse(false, null, 'app.error_action'));
    }
}
