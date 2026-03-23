<?php

use App\Http\Controllers\Auth\DiscordController;
use App\Http\Controllers\GuildController;
use App\Http\Middleware\SelectedGuildMiddleware;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::get('/login/discord', [DiscordController::class, 'redirectToDiscord'])->name('login.discord');
Route::get('/login/callback', [DiscordController::class, 'handleDiscordCallback']);

Route::middleware(['auth'])->group(function () {
    Route::get('/guilds/selector', [GuildController::class, 'selector'])->name('guilds.selector');

    Route::middleware([SelectedGuildMiddleware::class])->group(function () {
        Route::inertia('dashboard', 'dashboard')->name('dashboard');
    });
});

require __DIR__.'/settings.php';
