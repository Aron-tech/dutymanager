<?php

use App\Http\Controllers\Auth\DiscordController;
use App\Http\Controllers\GuildController;
use App\Http\Middleware\RequireGuildSetupMiddleware;
use App\Http\Middleware\SelectedGuildMiddleware;
use Illuminate\Foundation\Http\Middleware\HandlePrecognitiveRequests;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::get('/login/discord', [DiscordController::class, 'redirectToDiscord'])->name('login.discord');
Route::get('/login/callback', [DiscordController::class, 'handleDiscordCallback']);

Route::middleware(['auth'])->group(function () {
    Route::get('/guilds/selector', [GuildController::class, 'selector'])->name('guilds.selector');
    Route::post('/guilds/select/{guild}', [GuildController::class, 'select'])->name('guilds.select');

    Route::middleware([SelectedGuildMiddleware::class, RequireGuildSetupMiddleware::class])->group(function () {
        Route::inertia('dashboard', 'dashboard')->name('dashboard');
        Route::get('/guilds/setup', [GuildController::class, 'show'])->name('guild.setup.show');
        Route::post('/guilds/setup/features', [GuildController::class, 'saveFeatures'])->name('guild.setup.features.save');
        Route::post('/guilds/setup/feature/{feature_id}', [GuildController::class, 'saveFeatureSettings'])->name('guild.setup.feature.save')->middleware([HandlePrecognitiveRequests::class]);
        Route::post('/guilds/setup/finish', [GuildController::class, 'finish'])->name('guild.setup.finish');
    });
});

require __DIR__.'/settings.php';
