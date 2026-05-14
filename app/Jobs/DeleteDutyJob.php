<?php

namespace App\Jobs;

use App\Actions\DeleteActiveDutyAction;
use App\Enums\ActionTypeEnum;
use App\Models\ActivityLog;
use App\Models\Duty;
use Illuminate\Bus\Batchable;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;

class DeleteDutyJob implements ShouldQueue
{
    use Batchable, Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public Duty $duty,
        public ?string $causer_id
    ) {}

    public function handle(): bool
    {
        if ($this->batch()?->cancelled()) {
            return false;
        }

        return DB::transaction(function () {
            $duty_data = $this->duty->toArray();

            DeleteActiveDutyAction::run($this->duty, $this->causer_id);

            ActivityLog::make(
                $this->duty->guild_id,
                $this->causer_id,
                $this->duty->user_id,
                ActionTypeEnum::DELETE_DUTY_FROM_GUILD_USER,
                $duty_data
            );

            return $this->duty->delete();
        });
    }
}
