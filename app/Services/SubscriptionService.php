<?php

namespace App\Services;

use App\Models\Guild;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class SubscriptionService
{
    public function attachToGuild(Subscription $subscription, Guild $guild, User $user): void
    {
        if ($subscription->user_id !== $user->id) {
            abort(403, 'app.error_no_permission');
        }

        if (! $subscription->canChangeGuild()) {
            throw new \Exception('A szerver módosítása ebben a hónapban már nem lehetséges.');
        }

        DB::transaction(function () use ($subscription, $guild, $user): void {
            $active_subscription = $guild->activeSubscription()->lockForUpdate()->first();

            if ($active_subscription !== null && $active_subscription->id !== $subscription->id) {
                if ($guild->owner_id !== $user->id) {
                    throw new \Exception('Ehhez a szerverhez már csatolva van egy aktív előfizetés.');
                }

                $active_subscription->update(['guild_id' => null]);
            }

            $subscription->update([
                'guild_id' => $guild->id,
                'guild_last_changed_at' => now(),
            ]);
        });
    }

    public function detachFromGuild(Subscription $subscription, User $user): void
    {
        $guild = $subscription->guild;

        if ($guild === null) {
            return;
        }

        if ($subscription->user_id !== $user->id && $guild->owner_id !== $user->id) {
            abort(403, 'Nincs jogosultságod a leválasztáshoz.');
        }

        $subscription->update(['guild_id' => null]);
    }
}
