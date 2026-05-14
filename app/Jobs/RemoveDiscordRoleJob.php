<?php

namespace App\Jobs;

use App\Services\DiscordFetchService;
use Exception;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class RemoveDiscordRoleJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public string $guild_id,
        public string $user_id,
        public array $role_ids
    ) {}

    /**
     * @throws Exception
     */
    public function handle(): void
    {
        foreach ($this->role_ids as $role_id) {
            $success = DiscordFetchService::removeRoleFromMember(
                $this->guild_id,
                $this->user_id,
                $role_id
            );

            if (! $success) {
                throw new Exception("Sikertelen rang eltávolítás. Guild ID: {$this->guild_id}, User ID: {$this->user_id}, Role ID: {$role_id}");
            }
        }
    }
}
