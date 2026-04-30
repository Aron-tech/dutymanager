<?php

use App\Http\Controllers\Api\GuildController;

use App\Http\Controllers\Api\GuildUserController;
use Illuminate\Support\Facades\Route;

Route::prefix('/guild')->group(function () {
    Route::get('/active', [GuildController::class, 'actives']);
    Route::post('/add', [GuildController::class, 'addBot']);
    Route::get('/{guild}/settings', [GuildController::class, 'getGuildSettings']);
    Route::get('/{guild}/whitelist-roles', [GuildController::class, 'getRolesWhitelist']);
    Route::put('/{guild}/sync-roles', [GuildUserController::class, 'updateRoles']);
});

Route::put('/duty/toggle', [GuildUserController::class, 'toggleDuty'])->middleware('api.context');
