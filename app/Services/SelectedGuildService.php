<?php

namespace App\Services;

use App\Models\Guild;
use Illuminate\Support\Facades\Session;

class SelectedGuildService
{
    public const string SESSION_KEY = 'selected_guild_id';

    public static function set(Guild $guild): void
    {
        Session::put(self::SESSION_KEY, $guild->id);
    }

    public static function get(): ?Guild
    {
        return once(function () {
            $id = Session::get(self::SESSION_KEY);

            if (! $id) {
                return null;
            }

            return Guild::with('guildSettings')->find($id);
        });
    }

    /*
     * @return bool
     */
    public static function isSelected(): bool
    {
        return Session::has(self::SESSION_KEY);
    }

    public static function clear(): void
    {
        Session::forget(self::SESSION_KEY);
    }
}
