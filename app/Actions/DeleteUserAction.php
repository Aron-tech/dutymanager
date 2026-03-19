<?php

namespace App\Actions;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Lorisleiva\Actions\Concerns\AsAction;

class DeleteUserAction
{
    use AsAction;

    /**
     * @throws \Throwable
     */
    public function handle(): void
    {
        DB::transaction(function (User $user) {
            $user->delete();
        });
    }
}
