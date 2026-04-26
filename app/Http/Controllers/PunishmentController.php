<?php

namespace App\Http\Controllers;

use App\Enums\PunishmentTypeEnum;
use App\Http\Requests\BulkDeletePunishmentRequest;
use App\Http\Requests\IndexPunishmentRequest;
use App\Http\Requests\StorePunishmentRequest;
use App\Models\Punishment;
use App\Services\PunishmentService;
use App\Services\SelectedGuildService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class PunishmentController extends Controller
{
    public function __construct(protected readonly PunishmentService $service) {}

    public function index(IndexPunishmentRequest $request, PunishmentService $service): Response
    {
        $guild = SelectedGuildService::get();
        $filters = $request->validated();

        $punishments = $service->getPaginatedPunishments($guild, $filters);

        $guild_users = $guild->acceptedGuildUsers()
            ->with('user:id,name')
            ->get()
            ->map(function ($gu) {
                return [
                    'id' => $gu->id,
                    'label' => ($gu->ic_name ? $gu->ic_name.' - ' : '').($gu->user?->name ?? 'Ismeretlen'),
                    'full_user' => $gu,
                ];
            })->values()->toArray();

        $available_types = PunishmentTypeEnum::getOptions();

        return Inertia::render('punishments/index', [
            'punishments' => $punishments,
            'filters' => empty($filters) ? (object) [] : $filters,
            'guild_users' => $guild_users,
            'available_types' => $available_types,
        ]);
    }

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
