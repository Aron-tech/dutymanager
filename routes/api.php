<?php

use App\Http\Controllers\Api\GuildController;

use App\Http\Controllers\Api\GuildUserController;
use Illuminate\Support\Facades\Route;

Route::prefix('/guild')->group(function () {
    Route::post('/add', [GuildController::class, 'addBot']);
    Route::get('/{guild}/settings', [GuildController::class, 'getGuildSettings']);
    Route::put('/roles', [GuildUserController::class, 'updateRoles']);
});

Route::put('/duty/toggle', [GuildUserController::class, 'toggleDuty'])->middleware('api.context');
