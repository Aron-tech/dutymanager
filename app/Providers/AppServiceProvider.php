<?php

namespace App\Providers;

use App\Models\Duty;
use App\Models\Guild;
use App\Models\GuildUser;
use App\Models\Image;
use App\Models\Item;
use App\Models\Subscription;
use App\Models\User;
use App\Observers\DutyObserver;
use App\Observers\GuildObserver;
use App\Observers\GuildUserObserver;
use App\Observers\ImageObserver;
use App\Observers\ItemObserver;
use Illuminate\Support\ServiceProvider;
use Laravel\Cashier\Cashier;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        GuildUser::observe(GuildUserObserver::class);
        Duty::observe(DutyObserver::class);
        Image::observe(ImageObserver::class);
        Guild::observe(GuildObserver::class);
        Item::observe(ItemObserver::class);
        Cashier::useSubscriptionModel(Subscription::class);
        Cashier::useCustomerModel(User::class);
    }
}
