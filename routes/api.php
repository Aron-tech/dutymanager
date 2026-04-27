<?php

use App\Http\Controllers\Api\GuildController;

use Illuminate\Support\Facades\Route;

Route::prefix('/guild')->group(function () {
    Route::post('/add', [GuildController::class, 'addBot']);
    Route::get('/{guild}', [GuildController::class, 'getGuildSettings']);
});
