<?php

declare(strict_types=1);

namespace App\Services\Command;

use App\Jobs\DeleteDutyJob;
use App\Models\Duty;
use App\Models\Holiday;
use App\Models\Punishment;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\DB;

readonly class CleanupService
{
    public function cancelInvalidActiveDuties(CarbonInterface $limit): int
    {
        $duties = Duty::activeDuties()->where('started_at', '<', $limit)->get();
        $duties_count = $duties->count();

        if ($duties_count === 0) {
            return 0;
        }

        $jobs = [];

        foreach ($duties as $duty) {
            $jobs[] = new DeleteDutyJob($duty, null);
        }

        Bus::batch($jobs)->dispatch();

        return $duties_count;
    }

    public function purgeOldDuties(CarbonInterface $limit): int
    {
        return Punishment::onlyTrashed()->where('deleted_at', '<', $limit)->forceDelete();
    }

    public function purgeOldPunishments(CarbonInterface $limit): int
    {
        return DB::transaction(function () use ($limit) {
            return Punishment::withTrashed()
                ->where(function (Builder $query) use ($limit): void {
                    $query->where('expires_at', '<', $limit)
                        ->orWhere('deleted_at', '<', $limit);
                })
                ->forceDelete();
        });
    }

    public function purgeOldHolidays(CarbonInterface $limit): int
    {
        return DB::transaction(function () use ($limit) {
            return Holiday::withTrashed()
                ->where(function (Builder $query) use ($limit): void {
                    $query->where('ended_at', '<', $limit)
                        ->orWhere('deleted_at', '<', $limit);
                })
                ->forceDelete();
        });
    }
}
