 <?php

use App\Http\Controllers\Auth\DiscordController;
use App\Http\Controllers\DutyController;
use App\Http\Controllers\GuildController;
use App\Http\Controllers\GuildUserController;
use App\Http\Controllers\ItemController;
use App\Http\Controllers\PageController;
use App\Http\Controllers\PunishmentController;
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
        Route::get('dashboard', [PageController::class, 'dashboard'])->name('dashboard');
        Route::get('/guilds/setup', [GuildController::class, 'show'])->name('guild.setup.show');
        Route::post('/guilds/setup/features', [GuildController::class, 'saveFeatures'])->name('guild.setup.features.save')->middleware([HandlePrecognitiveRequests::class]);
        Route::post('/guilds/setup/feature/{feature_id}', [GuildController::class, 'saveFeatureSettings'])->name('guild.setup.feature.save')->middleware([HandlePrecognitiveRequests::class]);
        Route::post('/guilds/setup/finish', [GuildController::class, 'finish'])->name('guild.setup.finish');

        Route::prefix('panel')->group(function () {
            Route::get('/', [GuildUserController::class, 'index'])->name('guild.users.index');
            Route::post('/', [GuildUserController::class, 'store'])->name('guild.users.store');
            Route::put('/{guild_user}', [GuildUserController::class, 'update'])->name('guild.users.update');
            Route::get('/{guild_user}/image', [GuildUserController::class, 'getImagesData'])->name('guild.users.image');
            Route::get('/{guild_user}/duties', [GuildUserController::class, 'getDutiesData'])->name('guild.users.duties');
            Route::get('/{guild_user}/punishments', [GuildUserController::class, 'getPunishmentsData'])->name('guild.users.punishments');
            Route::get('/image/{image}', [GuildUserController::class, 'showImage'])->name('guild.users.image.show');
            Route::post('/{guild_user}/image', [GuildUserController::class, 'storeImage'])->name('guild.users.image.store');
            Route::delete('/image/{image}', [GuildUserController::class, 'deleteImage'])->name('guild.users.image.delete');
            Route::delete('/{guild_user}', [GuildUserController::class, 'delete'])->name('guild.users.delete');
            Route::delete('/', [GuildUserController::class, 'bulkDelete'])->name('guild.users.bulk.delete');
        });

        Route::prefix('duty')->group(function () {
            Route::post('/{guild_user}', [GuildUserController::class, 'toggleDuty'])->name('duty.toggle');
            Route::post('/', [DutyController::class, 'store'])->name('duty.store');
            Route::put('/status', [DutyController::class, 'updateStatuses'])->name('duty.update.status');
            Route::put('/{duty}', [DutyController::class, 'update'])->name('duty.update');
            Route::delete('/', [DutyController::class, 'bulkDelete'])->name('duty.bulk.delete');
            Route::delete('/{duty}', [DutyController::class, 'delete'])->name('duty.delete');
        });

        Route::prefix('punishment')->group(function () {
            Route::post('/', [PunishmentController::class, 'store'])->name('punishment.store');
            Route::delete('/', [PunishmentController::class, 'bulkDelete'])->name('punishment.bulk.delete');
            Route::delete('/{punishment}', [PunishmentController::class, 'delete'])->name('punishment.delete');
        });

        Route::prefix('item')->group(function () {
            Route::get('/', [ItemController::class, 'index'])->name('items.index');
            Route::post('/', [ItemController::class, 'store'])->name('items.store');
        });
    });
});

require __DIR__.'/settings.php';
