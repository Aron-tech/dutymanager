<?php

namespace App\Http\Middleware;

use App\Models\Guild;
use App\Models\User;
use App\Services\GuildPermissionResolver;
use App\Services\SelectedGuildService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\File;
use Inertia\Inertia;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $permissions = [];
        $user = $request->user();
        $guild = null;

        if ($user) {
            $guild = SelectedGuildService::get();
            if ($guild) {
                $permissions = self::resolvePermissions($user, $guild);
            }
        }

        $locale = App::getLocale();

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'locale' => App::getLocale(),
            'auth' => [
                'user' => $user,
                'permissions' => $permissions,
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'selectedGuild' => $guild?->only(['id', 'name', 'icon', 'is_installed']),
            'activeGuild' => $request->session()->get('selected_guild_id'),
            'guildHasActiveSubscription' => $guild?->hasActiveSubscription() ?? false,
            'ziggy' => fn () => [
                ...(new Ziggy)->toArray(),
                'location' => $request->url(),
            ],
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
            ],
            'translations' => Inertia::once(fn () => self::loadTranslations($locale))->as("translations.{$locale}"),
            'discordBotInviteUrl' => self::discordBotInviteUrl(),
        ];
    }

    /**
     * Delegates to GuildPermissionResolver (also used by AuthServiceProvider's Gate::before)
     * so the UI always shows exactly what the backend allows.
     *
     * @return list<string>
     */
    private static function resolvePermissions(User $user, Guild $guild): array
    {
        return GuildPermissionResolver::resolve($user, $guild) ?? [];
    }

    /**
     * @return array<string, mixed>
     */
    private static function loadTranslations(string $locale): array
    {
        $translations = [];
        $path = lang_path($locale);

        if (! File::isDirectory($path)) {
            return $translations;
        }

        foreach (File::allFiles($path) as $file) {
            if ($file->getExtension() === 'php') {
                $translations[$file->getFilenameWithoutExtension()] = require $file->getRealPath();
            }
        }

        return $translations;
    }

    /**
     * OAuth2 URL that adds the bot to a server (not an invite to the support server).
     */
    public static function discordBotInviteUrl(): string
    {
        return 'https://discord.com/oauth2/authorize?'.http_build_query([
            'client_id' => config('services.discord.client_id'),
            'permissions' => config('services.discord.bot_permissions'),
            'scope' => 'bot applications.commands',
            'integration_type' => 0,
        ], '', '&', PHP_QUERY_RFC3986);
    }
}
