import type { InertiaLinkProps } from '@inertiajs/react';
import { clsx } from 'clsx';
import type { ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function toUrl(url: NonNullable<InertiaLinkProps['href']>): string {
    return typeof url === 'string' ? url : url.url;
}

export const formatDuty = (totalMinutes: number | null | undefined): string => {
    if (!totalMinutes || totalMinutes < 0) {
        return '00:00';
    }

    const rawMinutes = Math.floor(totalMinutes);

    const hours = Math.floor(rawMinutes / 60);
    const minutes = rawMinutes % 60;

    const formattedHours = String(hours).padStart(2, '0');
    const formattedMinutes = String(minutes).padStart(2, '0');

    return `${formattedHours}:${formattedMinutes}`;
};
