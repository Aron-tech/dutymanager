<?php

namespace App\Http\Controllers;

use App\Http\Requests\BulkDeletePunishmentRequest;
use App\Http\Requests\StorePunishmentRequest;
use App\Models\Punishment;
use App\Services\PunishmentService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Log;
use Throwable;

class PunishmentController extends Controller
{
    public function __construct(protected readonly PunishmentService $service) {}

    public function store(StorePunishmentRequest $request)
    {
        $data = $request->validated();
        try {
            $this->service->create($data);

            return back()->with('success', 'Büntetés sikeresen kiosztva.');
        } catch (Throwable $e) {
            Log::error($e);

            return back()->withErrors([$e->getMessage()])->withInput();
        }
    }

    public function delete(Punishment $punishment): RedirectResponse
    {
        try {
            $type = $punishment->type->getLabel();
            $this->service->delete($punishment);

            return back()->with('success', 'Sikeresen visszavonva a(z) '.$type.'.');
        } catch (Throwable $e) {
            Log::error($e);

            return back()->withErrors([$e->getMessage()]);
        }
    }

    public function bulkDelete(BulkDeletePunishmentRequest $request): RedirectResponse
    {
        $data = $request->validated();

        try {
            $deleted_count = $this->service->bulkDelete($data['punishment_ids']);

            return back()->with('succes', 'Sikeresen visszavonva '.$deleted_count.' darab büntetés.');
        } catch (Throwable $e) {
            Log::error($e);

            return back()->withErrors([$e->getMessage()])->withInput();
        }
    }
}
