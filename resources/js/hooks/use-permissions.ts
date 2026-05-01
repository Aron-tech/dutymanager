import { usePage } from '@inertiajs/react';

export function usePermissions() {
    const { auth } = usePage().props as any;

    const can = (permission: string) => {
        if (auth?.user?.global_role === 'developer') {
            return true;
        }

        const permissions = Array.isArray(auth?.permissions) ? auth.permissions : [];

        if (permissions.length === 0) {
            return false;
        }

        if (permissions.includes('all')) {
            return true;
        }

        return permissions.includes(permission);
    };

    const canAny = (requested_permissions: string[]) => {
        if (auth?.user?.global_role === 'developer') {
            return true;
        }

        const permissions = Array.isArray(auth?.permissions) ? auth.permissions : [];

        if (permissions.length === 0) {
            return false;
        }

        if (permissions.includes('all')) {
            return true;
        }

        return requested_permissions.some((p) => permissions.includes(p));
    };

    return {
        can,
        canAny,
        permissions: Array.isArray(auth?.permissions) ? auth.permissions : [],
    };
}
