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
            [key: string]: unknown;
        };
    }
}

declare global {
    interface Window {
        axios: AxiosInstance;
        route: typeof ziggyRoute;
        Echo: Echo;
        Pusher: typeof Pusher;
    }
}
