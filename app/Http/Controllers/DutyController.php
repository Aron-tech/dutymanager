<?php

namespace App\Http\Controllers;

use App\Enums\DutyStatusEnum;
use App\Enums\PermissionEnum;
use App\Http\Requests\BulkDeleteDutyRequest;
use App\Http\Requests\IndexDutyRequest;
use App\Http\Requests\StoreDutyRequest;
use App\Http\Requests\UpdateDutyRequest;
use App\Http\Requests\UpdateStatusDutyRequest;
use App\Models\Duty;
use App\Services\DutyService;
use App\Services\SelectedGuildService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class DutyController extends Controller
{
    public function __construct(private readonly DutyService $service) {}

    public function index(IndexDutyRequest $request): Response
    {
        if (auth()->user()->cannot(PermissionEnum::VIEW_DUTIES)) {
            abort(403, __('app.error.no_permission'));
        }

        $guild = SelectedGuildService::get();
        $filters = $request->validated();

        $duties = $this->service->getPaginatedDuties($guild, $filters);

        $guild_users = $guild->acceptedGuildUsers()
            ->with('user:id,name')
            ->get()
            ->map(function ($gu) {
                return [
                    'id' => $gu->id,
                    'label' => ($gu->ic_name ? $gu->ic_name.' - ' : '').$gu->user->name,
                    'full_user' => $gu,
                ];
            })->values()->toArray();

        return Inertia::render('duties/index', [
            'duties' => $duties,
            'filters' => empty($filters) ? (object) [] : $filters,
            'guild_users' => $guild_users,
        ]);
    }

    public function active(IndexDutyRequest $request): Response
    {
        if ($request->user()->cannot(PermissionEnum::VIEW_DUTIES->value)) {
            abort(403, __('app.error.no_permission'));
        }

        $guild = SelectedGuildService::get();
        $filters = $request->validated();

        $active_duties = $this->service->getPaginatedActiveDuties($guild, $filters);
        $chart_data = $this->service->getHourlyChartData($guild);

        return Inertia::render('duties/active', [
            'active_duties' => $active_duties,
            'current_active_count' => $active_duties->total(),
            'chart_data' => $chart_data,
            'filters' => empty($filters) ? (object) [] : $filters,
        ]);
    }

    public function store(StoreDutyRequest $request): RedirectResponse
    {
        if (auth()->user()->cannot(PermissionEnum::ADD_DUTIES)) {
            abort(403, __('app.error.no_permission'));
        }

        $data = $request->validated();
        try {
            $this->service->storeDuty($data);

            return back()->with('success', __('duty.success_duty_add'))->withInput();
        } catch (Throwable $e) {
            Log::error($e->getMessage());

            return back()->withErrors(['form_error' => $e->getMessage()])->withInput();
        }
    }

    public function update(Duty $duty, UpdateDutyRequest $request): RedirectResponse
    {
        if (auth()->user()->cannot(PermissionEnum::EDIT_DUTIES)) {
            abort(403, __('app.error.no_permission'));
        }

        $data = $request->validated();
        try {
            $duty->update($data);

            return back()->with('success', __('duty.success_duty_update'))->withInput();
        } catch (Throwable $e) {
            Log::error($e->getMessage());

            return back()->withErrors(['form_error' => $e->getMessage()])->withInput();
        }
    }

    public function updateStatuses(UpdateStatusDutyRequest $request): RedirectResponse
    {
        if (auth()->user()->cannot(PermissionEnum::DELETE_DUTIES)) {
            abort(403, __('app.error.no_permission'));
        }

        $data = $request->validated();
        try {
            $status_enum = DutyStatusEnum::from($data['status']);
            $this->service->updateDutiesStatus($data['duty_ids'], $status_enum);

            return back()->with('success', __('duty.success_duty_update_status'));
        } catch (Throwable $e) {
            Log::error($e->getMessage());

            return back()->withErrors(['form_error' => $e->getMessage()])->withInput();
        }

    }

    public function delete(Duty $duty)
    {
        if (auth()->user()->cannot(PermissionEnum::DELETE_DUTIES)) {
            abort(403, __('app.error.no_permission'));
        }

        try {
            $this->service->deleteDuty($duty);

            return back()->with('success', __('duty.success_duty_delete'));
        } catch (Throwable $e) {
            Log::error($e->getMessage());

            return back()->withErrors(['form_error' => $e->getMessage()])->withInput();
        }
    }

    public function bulkDelete(BulkDeleteDutyRequest $request): RedirectResponse
    {
        $data = $request->validated();

        if (auth()->user()->cannot(PermissionEnum::DELETE_DUTIES)) {
            abort(403, __('app.error.no_permission'));
        }

        $status = isset($data['status']) ? DutyStatusEnum::from((int) $data['status']) : DutyStatusEnum::ALL_PERIOD;

        try {
            $this->service->deleteDuties($data['duty_ids'], $status);

            return back()->with('success', __('duty.duties_delete_started'));
        } catch (Throwable $e) {
            Log::error($e->getMessage());

            return back()->withErrors(['form_error' => __('app.error_action')])->withInput();
        }
    }

    /**
     * @throws Throwable
     */
    public function reset()
    {
        if (auth()->user()->cannot(PermissionEnum::EDIT_DUTIES)) {
            abort(403, __('app.error.no_permission'));
        }

        $guild = SelectedGuildService::get();

        try {
            $updated_duties_count = $this->service->resetDutiesForGuild($guild);

            if ($updated_duties_count > 0) {
                return back()->with('success', __('duty.success_duty_update_status'));
            }

            return back()->with('error', __('app.error_action'));
        } catch (Throwable $exception) {
            return back()->with('error', __('app.error_action'));
        }
    }
}
