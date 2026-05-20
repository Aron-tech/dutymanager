<?php

namespace App\Services;

use App\Models\Guild;
use Illuminate\Support\Facades\Session;

class SelectedGuildService
{
    public const string SESSION_KEY = 'selected_guild_id';

    private static ?Guild $resolved_guild = null;

    public static function set(Guild $guild): void
    {
        self::$resolved_guild = $guild;

        if (config('session.driver') !== null && ! request()->is('api/*')) {
            Session::put(self::SESSION_KEY, $guild->id);
        }
    }

    public static function setFromDiscord(string $guild_id): void
    {
        $guild = Guild::where('id', $guild_id)->with('guildSettings')->first();
        if ($guild) {
            self::$resolved_guild = $guild;
        }
    }

    public static function get(): ?Guild
    {
        if (self::$resolved_guild) {
            return self::$resolved_guild;
        }

        if (! Session::has(self::SESSION_KEY) || ! auth()->check()) {
            return null;
        }

        $guild_id = Session::get(self::SESSION_KEY);
        $user = auth()->user();

        $guild = $user->guilds()->with('guildSettings')->find($guild_id);

        if (! $guild) {
            self::clear();

            return null;
        }

        self::$resolved_guild = $guild;

        return self::$resolved_guild;
    }

    public static function isSelected(): bool
    {
        return self::$resolved_guild !== null || Session::has(self::SESSION_KEY);
    }

    public static function clear(): void
    {
        self::$resolved_guild = null;
        Session::forget(self::SESSION_KEY);
    }
}
