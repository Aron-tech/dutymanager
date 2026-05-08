import { usePage, router } from '@inertiajs/react';
import { useEffect } from 'react';
import { toast } from 'sonner';

export const useUserNotifications = () => {
    const { auth } = usePage().props as any;

    useEffect(() => {
        if (!auth?.user?.id || typeof window === 'undefined' || !window.Echo) {
            return;
        }

        const channel_name = `user.${auth.user.id}`;

        const channel = window.Echo.private(channel_name)
            .listen('.SendUserMessageEvent', (event: { message: string; type: string }) => {
                const message = event.message;

                switch (event.type) {
                    case 'success':
                        toast.success(message);
                        break;
                    case 'error':
                    case 'danger':
                        toast.error(message);
                        break;
                    case 'warning':
                        toast.warning(message);
                        break;
                    case 'info':
                    default:
                        toast.info(message);
                        break;
                }

                router.reload({ preserveScroll: true });
            });

        return () => {
            channel.stopListening('.SendUserMessageEvent');
            window.Echo.leave(channel_name);
        };
    }, [auth?.user?.id]);
};
