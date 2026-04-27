<?php

use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\InitializeApiContextMiddleware;
use App\Http\Middleware\SetLanguageMiddleware;
use App\Http\Middleware\VerifyApiTokenMiddleware;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Inertia\Inertia;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        $middleware->web(append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
            SetLanguageMiddleware::class,
        ]);

        $middleware->api(append: [
            VerifyApiTokenMiddleware::class,
        ]);

        $middleware->alias([
            'api.context' => InitializeApiContextMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->respond(function ($response, $exception, $request) {
            if ($response->getStatusCode() === 403) {
                return Inertia::render('Errors/Error', [
                    'status' => 403,
                    'message' => $exception->getMessage() ?: 'Nincs jogosultságod a művelethez.',
                ])->toResponse($request)->setStatusCode(403);
            }

            return $response;
        });
    })->create();
