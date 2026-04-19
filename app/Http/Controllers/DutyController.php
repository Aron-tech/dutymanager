<?php

namespace App\Http\Controllers;

use App\Enums\DutyStatusEnum;
use App\Http\Requests\BulkDeleteDutyRequest;
use App\Http\Requests\StoreDutyRequest;
use App\Http\Requests\UpdateDutyRequest;
use App\Http\Requests\UpdateStatusDutyRequest;
use App\Models\Duty;
use App\Services\DutyService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Log;
use Throwable;

class DutyController extends Controller
{
    public function __construct(private readonly DutyService $service) {}

    public function store(StoreDutyRequest $request): RedirectResponse
    {
        $data = $request->validated();
        try {
            $this->service->storeDuty($data);

            return back()->with('success', 'Szolgálati idő sikeresen hozzáadva.')->withInput();
        } catch (Throwable $e) {
            Log::error($e->getMessage());

            return back()->withErrors(['form_error' => $e->getMessage()])->withInput();
        }
    }

    public function update(Duty $duty, UpdateDutyRequest $request): RedirectResponse
    {
        $data = $request->validated();
        try {
            $duty->update($data);

            return back()->with('success', 'Szolgáltatási idő sikeresen módosítve.')->withInput();
        } catch (Throwable $e) {
            Log::error($e->getMessage());

            return back()->withErrors(['form_error' => $e->getMessage()])->withInput();
        }
    }

    public function updateStatuses(UpdateStatusDutyRequest $request): RedirectResponse
    {
        $data = $request->validated();
        try {
            $status_enum = DutyStatusEnum::from($data['status']);
            $this->service->updateDutiesStatus($data['duty_ids'], $status_enum);

            return back()->with('success', 'Sikeresen módosítva a szogálati idő(k) státusza.');
        } catch (Throwable $e) {
            Log::error($e->getMessage());
            return back()->withErrors(['form_error' => $e->getMessage()])->withInput();
        }

    }

    public function delete(Duty $duty)
    {
        try {
            $this->service->deleteDuties([$duty->id]);

            return back()->with('success', 'Szolgálati idő sikeresen törölve.');
        } catch (Throwable $e) {
            Log::error($e->getMessage());

            return back()->withErrors(['form_error' => $e->getMessage()])->withInput();
        }
    }

    public function bulkDelete(BulkDeleteDutyRequest $request)
    {
        $data = $request->validated();
        $status = isset($data['status']) ? DutyStatusEnum::from((int) $data['status']) : DutyStatusEnum::ALL_PERIOD;

        try {
            $this->service->deleteDuties($data['duty_ids'], $status);

            return back()->with('succes', 'Szolgálati idők sikeresen törölve.');
        } catch (Throwable $e) {
            Log::error($e->getMessage());

            return back()->withErrors(['form_error' => $e->getMessage()])->withInput();
        }
    }
}
