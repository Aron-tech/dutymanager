<?php

namespace App\Http\Controllers;

use App\Models\Subscription;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class SubscriptionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $user = auth()->user();
        $subscriptionsConfig = config('params.subscriptions');

        $monthlyPrice = $subscriptionsConfig['monthly']['price'];
        $yearlyPrice = $subscriptionsConfig['yearly']['price'];
        $savings = ($monthlyPrice * 12) - $yearlyPrice;

        return Inertia::render('subscriptions/index', [
            'subscriptions' => $subscriptionsConfig,
            'savings' => $savings,
            'userSubscriptions' => $user->subscriptions()->with('guild')->get(),
            'availableGuilds' => $user->guilds()->whereNotIn('guilds.id', $user->subscriptions()->pluck('guild_id'))->get(),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'plan' => ['required', 'string', 'in:monthly,yearly'],
        ]);

        try {
            $user = $request->user();

            $planId = config('params.subscriptions.'.$request->plan.'.stripe_price_id');

            $checkout = $user->newSubscription('default', $planId)
                ->checkout([
                    'success_url' => route('subscriptions.index').'?session_id={CHECKOUT_SESSION_ID}',
                    'cancel_url' => route('subscriptions.index'),
                ]);

            return Inertia::location($checkout->url);
        } catch (AuthorizationException $e) {
            Log::warning('Subscription authorization failed: '.$e->getMessage(), ['user_id' => $request->user()->id]);

            return back()->with('flash', ['error' => 'Nincs jogosultságod előfizetést indítani.']);
        } catch (\Exception $e) {
            Log::error('Stripe Checkout Error: '.$e->getMessage(), ['trace' => $e->getTraceAsString()]);

            return back()->with('flash', ['error' => 'Hiba történt a fizetési folyamat indítása közben. Kérjük, próbáld újra később.']);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Subscription $subscription)
    {
        $request->validate([
            'guild_id' => ['required', 'string', 'exists:guilds,id'],
        ]);

        if ($subscription->user_id !== Auth::id()) {
            abort(403);
        }

        if (! $subscription->changeGuild($request->guild_id)) {
            return back()->withErrors(['guild_id' => 'A szerver módosítása ebben a hónapban már nem lehetséges.']);
        }

        return redirect()->route('subscriptions.index')->with('flash', ['success' => 'Szerver sikeresen módosítva!']);
    }
}
