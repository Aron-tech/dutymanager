<?php

declare(strict_types=1);

namespace App\Services\Command;

use App\Models\Duty;
use App\Models\Holiday;
use App\Models\Punishment;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;

readonly class CleanupService
{
    public function cancelInvalidActiveDuties(CarbonInterface $limit): int
    {
        return Duty::activeDuties()->where('started_at', '<', $limit)->delete();
    }

    public function purgeOldDuties(CarbonInterface $limit): int
    {
        return Punishment::onlyTrashed()->where('deleted_at', '<', $limit)->forceDelete();
    }

    public function purgeOldPunishments(CarbonInterface $limit): int
    {
        return Punishment::withTrashed()
            ->where(function (Builder $query) use ($limit): void {
                $query->where('expires_at', '<', $limit)
                    ->orWhere('deleted_at', '<', $limit);
            })
            ->forceDelete();
    }

    public function purgeOldHolidays(CarbonInterface $limit): int
    {
        return Holiday::withTrashed()
            ->where(function (Builder $query) use ($limit): void {
                $query->where('ended_at', '<', $limit)
                    ->orWhere('deleted_at', '<', $limit);
            })
            ->forceDelete();
    }
}
