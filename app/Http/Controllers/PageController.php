<?php

namespace App\Http\Controllers;

use App\Http\Requests\DashboardRequest;
use App\Services\PageService;
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
}
