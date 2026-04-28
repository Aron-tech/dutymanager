<?php

namespace App\Http\Controllers;

use App\Enums\PermissionEnum;
use App\Http\Requests\BulkDeleteHolidayRequest;
use App\Http\Requests\IndexHolidayRequest;
use App\Models\Holiday;
use App\Services\HolidayService;
use App\Services\SelectedGuildService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class HolidayController extends Controller
{
    public function __construct(private readonly HolidayService $service) {}

    public function index(IndexHolidayRequest $request): Response
    {
        if (auth()->user()->cannot(PermissionEnum::VIEW_GUILD_USERS)) {
            abort(403, __('app.error.no_permission'));
        }

        $guild = SelectedGuildService::get();
        $filters = $request->validated();

        $holidays = $this->service->getPaginatedHolidays($guild, $filters);

        return Inertia::render('holidays/index', [
            'holidays' => $holidays,
            'filters' => empty($filters) ? (object) [] : $filters,
        ]);
    }

    public function delete(Holiday $holiday): RedirectResponse
    {
        if (auth()->user()->cannot(PermissionEnum::CANCEL_HOLIDAY)) {
            abort(403, __('app.error.no_permission'));
        }

        try {
            $this->service->delete($holiday);

            return back()->with('success', 'Sikeresen visszavonva a szabadság.');
        } catch (Throwable $e) {
            Log::error($e);

            return back()->withErrors([$e->getMessage()]);
        }
    }

    public function bulkDelete(BulkDeleteHolidayRequest $request): RedirectResponse
    {
        if (auth()->user()->cannot(PermissionEnum::CANCEL_HOLIDAY)) {
            abort(403, __('app.error.no_permission'));
        }

        $data = $request->validated();

        try {
            $deleted_count = $this->service->bulkDelete($data['holiday_ids']);

            return back()->with('success', 'Sikeresen visszavonva '.$deleted_count.' darab szabadság.');
        } catch (Throwable $e) {
            Log::error($e);

            return back()->withErrors([$e->getMessage()])->withInput();
        }
    }
}
