import type { DiscordChannel, DiscordRole } from '@/types';

export const getChannelName = (id: string, channels: DiscordChannel[]) =>
    channels.find((c) => c.id === id)?.name || id;

export const getRoleName = (id: string, roles: DiscordRole[]) =>
    roles.find((r) => r.id === id)?.name || id;

export const getRoleColor = (id: string, roles: DiscordRole[]) => {
    const role = roles.find((r) => r.id === id);

    if (!role || !role.color) {
        return '#99aab5';
    }

    return typeof role.color === 'number'
        ? `#${role.color.toString(16).padStart(6, '0')}`
        : role.color;
};
