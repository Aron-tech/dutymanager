// resources/js/app.tsx

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { TooltipProvider } from '@/components/ui/tooltip';
import '../css/app.css';
import { initializeTheme } from '@/hooks/use-appearance';
// 1. Importáld a route függvényt
import { route } from 'ziggy-js';
import { Toaster } from 'sonner';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) =>
        resolvePageComponent(
            `./pages/${name}.tsx`,
            import.meta.glob('./pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        // 2. Globális elérhetővé tétel és konfiguráció injektálása
        // Az Inertia leküldi a Ziggy-t a props.initialPage.props.ziggy-ben
        const ziggy_config = (props.initialPage.props as any).ziggy;

        if (typeof window !== 'undefined') {
            (window as any).route = (name: any, params: any, absolute: any, config = ziggy_config) =>
                route(name, params, absolute, config);
        }

        const root = createRoot(el);

        root.render(
            <StrictMode>
                <TooltipProvider delayDuration={0}>
                    <App {...props} />
                    <Toaster richColors position="top-right" toastOptions={{ className: 'z-[9999]' }} />
                </TooltipProvider>
            </StrictMode>,
        );
    },
    progress: {
        color: '#4B5563',
    },
});

initializeTheme();
