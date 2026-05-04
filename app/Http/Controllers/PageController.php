<?php

namespace App\Http\Controllers;

use App\Enums\PermissionEnum;
use App\Http\Requests\DashboardRequest;
use App\Http\Requests\StatisticsRequest;
use App\Services\PageService;
use App\Services\SelectedGuildService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PageController extends Controller
{
    public function __construct(protected readonly PageService $service) {}

    public function welcome(): Response
    {
        return Inertia::render('welcome', ['canRegister' => false]);
    }

    public function dashboard(DashboardRequest $request): Response
    {
        $data = $request->validated();

        return Inertia::render('dashboard', $this->service->getDashboardData($data));
    }

    public function statistics(StatisticsRequest $request): Response
    {
        if (auth()->user()->cannot(PermissionEnum::VIEW_STATISTICS)) {
            abort(403, __('app.error_no_permission'));
        }

        $days = $request->validated()['days'] ?? 14;

        $guild = SelectedGuildService::get();

        $statistics = $this->service->getStatistics($guild->id, $days);

        return Inertia::render('statistics', [
            'statistics' => $statistics,
            'days' => $days,
        ]);
    }
}
