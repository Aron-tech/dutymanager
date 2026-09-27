import type { Auth } from '@/types/auth';
import { AxiosInstance } from 'axios';
import Echo from 'laravel-echo';
import type Pusher from 'pusher-js';
import { route as ziggyRoute } from 'ziggy-js';

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: Auth;
            activeGuild: string;
            sidebarOpen: boolean;
            guildHasActiveSubscription: boolean;
            discordBotInviteUrl: string;
            [key: string]: unknown;
        };
    }
}

declare global {
    // Assigned in app.tsx from the shared Ziggy config.
    var route: typeof ziggyRoute;

    interface Window {
        axios: AxiosInstance;
        route: typeof ziggyRoute;
        Echo: Echo;
        Pusher: typeof Pusher;
    }
}
