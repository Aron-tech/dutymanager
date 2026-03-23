<?php

namespace App\Http\Middleware;

use App\LanguageEnum;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Auth;

class SetLanguageMiddleware
{
    public function handle(Request $request, Closure $next): mixed
    {
        $supported_languages = LanguageEnum::getOptions();
        $current_language = config('app.locale');

        if ($request->hasCookie('language')) {
            $current_language = $request->cookie('language');
        } elseif (Auth::check()) {
            $language = Auth::user()->lang_code ?? null;
            $current_language = in_array($language, $supported_languages) ? $language : $current_language;
        }

        App::setLocale($current_language);

        $response = $next($request);

        if ($request->cookie('language') !== $current_language && ! empty($current_language)) {
            $response->cookie(cookie()->forever('language', $current_language));
        }

        return $response;
    }
}
