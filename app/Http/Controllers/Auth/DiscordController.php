<?php

namespace App\Http\Controllers\Auth;

use App\Actions\UpsertDiscordUserAction;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;

class DiscordController extends Controller
{
    public function redirectToDiscord(): RedirectResponse
    {
        return Socialite::driver('discord')->redirect();
    }

    public function handleDiscordCallback(): RedirectResponse
    {
        try {
            $discord_user = Socialite::driver('discord')->user();

            $data = [
                'id' => $discord_user->getId(),
                'nickname' => $discord_user->getName(),
                'global_name' => $discord_user->user['global_name'] ?? null,
                'email' => $discord_user->getEmail(),
                'avatar_url' => $discord_user->getAvatar(),
                'token' => $discord_user->token,
                'refresh_token' => $discord_user->refreshToken,
                'expires_in' => $discord_user->expiresIn,
                'language' => $discord_user->user['language'] ?? app()->getLocale(),
            ];

            $user = UpsertDiscordUserAction::run($data);

            Auth::login($user, true);

            return redirect()->route('dashboard');

        } catch (\Exception $e) {
            return redirect()->route('login')->withErrors([
                'discord' => __('auth.failed'),
            ]);
        }
    }
}
