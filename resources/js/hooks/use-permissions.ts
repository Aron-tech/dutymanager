import { usePage } from '@inertiajs/react';

export function usePermissions() {
    const { auth } = usePage().props;

    const can = (permission: string) => {
        if (!auth?.permissions) {
            return false;
        }

        if (auth.permissions.includes('all')) return true;

        return auth.permissions.includes(permission);
    };

    const canAny = (permissions: string[]) => {
        if (!auth?.permissions) {
            return false;
        }

        if (auth.permissions.includes('all')) {
            return true;
        }

        return permissions.some((p) => auth?.permissions?.includes(p) ?? false);
    };

    return {
        can,
        canAny,
        permissions: auth?.permissions || [],
    };
}
