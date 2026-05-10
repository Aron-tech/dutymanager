<?php

namespace App\Http\Controllers;

use App\Exceptions\GuildAlreadySubscribedException;
use App\Exceptions\UnauthorizedSubscriptionActionException;
use App\Http\Requests\UpdateSubscriptionRequest;
use App\Models\Guild;
use App\Models\Subscription;
use App\Services\SubscriptionService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class SubscriptionController extends Controller
{
    public function __construct(
        private readonly SubscriptionService $subscription_service
    ) {}

    public function index(Request $request): Response
    {
        $user = $request->user();
        $subscriptions_config = config('params.subscriptions');

        $monthly_price = $subscriptions_config['monthly']['price'];
        $yearly_price = $subscriptions_config['yearly']['price'];
        $savings = ($monthly_price * 12) - $yearly_price;

        return Inertia::render('subscriptions/index', [
            'subscriptions' => $subscriptions_config,
            'savings' => $savings,
            'userSubscriptions' => $user->subscriptions()->with('guild')->get(),
            'availableGuilds' => $user->guilds()
                ->whereNotIn('guilds.id', $user->subscriptions()->whereNotNull('guild_id')->pluck('guild_id'))
                ->get(),
        ]);
    }

    // ... (store metódus változatlan)

    public function update(UpdateSubscriptionRequest $request, Subscription $subscription): RedirectResponse
    {
        $data = $request->validated();

        $guild = Guild::findOrFail($data['guild_id']);
        $user = auth()->user();

        try {
            $this->subscription_service->attachToGuild($subscription, $guild, $user);
        } catch (\Exception $e) {
            Log::error('Subscription update failed: '.$e->getMessage());

            return back()->withErrors(['guild_id' => 'Kritikus hiba történt a csatolás során.']);
        }

        return redirect()->route('subscriptions.index')->with('flash', ['success' => 'Szerver sikeresen módosítva!']);
    }

    public function detach(Request $request, Subscription $subscription): RedirectResponse
    {
        $user = $request->user();

        try {
            $this->subscription_service->detachFromGuild($subscription, $user);
        } catch (UnauthorizedSubscriptionActionException $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        } catch (\Exception $e) {
            Log::error('Subscription detach failed: '.$e->getMessage());

            return back()->withErrors(['error' => 'Kritikus hiba történt a leválasztás során.']);
        }

        return redirect()->route('subscriptions.index')->with('flash', ['success' => 'Előfizetés sikeresen leválasztva!']);
    }
}
