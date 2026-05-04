<?php

namespace App\Http\Controllers;

use App\Enums\ActionTypeEnum;
use App\Enums\FeatureEnum;
use App\Enums\PermissionEnum;
use App\Http\Requests\IndexActivityLogRequest;
use App\Services\ActivityLogService;
use App\Services\SelectedGuildService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ActivityLogController extends Controller
{
    public function __construct(protected readonly ActivityLogService $service) {}

    public function index(IndexActivityLogRequest $request): Response
    {
        if (auth()->user()->cannot(PermissionEnum::VIEW_LOGS)) {
            abort(403, __('app.error.no_permission'));
        }

        $guild = SelectedGuildService::get();
        $filters = $request->validated();

        $logs = $this->service->getPaginatedLogs($guild, $filters);

        $available_actions = ActionTypeEnum::getOptions();
        $action_labels = [];
        foreach ($available_actions as $action) {
            $action_labels[$action] = ActionTypeEnum::from($action)->getLabel();
        }

        return Inertia::render('activity-logs/index', [
            'logs' => $logs,
            'filters' => empty($filters) ? (object) [] : $filters,
            'available_actions' => $action_labels,
        ]);
    }
}
