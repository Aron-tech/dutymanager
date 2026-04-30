import {
    AlertTriangle,
    MessageSquareWarning,
    Calendar,
    User,
    Ban,
    Palmtree,
} from 'lucide-react';
import React from 'react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { formatDate } from '@/lib/utils';

const SORT_ORDER: Record<string, number> = {
    verbal_warning: 1,
    warning: 2,
    blacklist: 3,
};

const getPunishmentConfig = (type: string) => {
    switch (type) {
        case 'verbal_warning':
            return {
                icon: <MessageSquareWarning className="h-4 w-4" />,
                color: 'text-muted-foreground hover:text-foreground bg-muted border-border',
                label: 'Szóbeli figyelmeztetés',
            };
        case 'warning':
            return {
                icon: <AlertTriangle className="h-4 w-4" />,
                color: 'text-muted-foreground hover:text-yellow-500 bg-muted border-border',
                label: 'Figyelmeztetés',
            };
        case 'blacklist':
            return {
                icon: <Ban className="h-4 w-4" />,
                color: 'text-muted-foreground hover:text-red-500 bg-muted border-border',
                label: 'Feketelista',
            };
        default:
            return {
                icon: <AlertTriangle className="h-4 w-4" />,
                color: 'text-muted-foreground bg-muted border-border',
                label: 'Büntetés',
            };
    }
};

export default function PunishmentsCell({
    punishments,
    active_holiday,
}: {
    punishments?: any[];
    active_holiday?: any;
}) {
    const safePunishments = punishments || [];

    if (safePunishments.length === 0 && !active_holiday) {
        return <span className="text-muted-foreground">-</span>;
    }

    const grouped = safePunishments.reduce((acc: any, curr: any) => {
        if (!acc[curr.type]) {
            acc[curr.type] = [];
        }

        acc[curr.type].push(curr);

        return acc;
    }, {});

    const sortedEntries = Object.entries(grouped).sort(([typeA], [typeB]) => {
        const orderA = SORT_ORDER[typeA] || 99;
        const orderB = SORT_ORDER[typeB] || 99;

        return orderA - orderB;
    });

    return (
        <TooltipProvider delayDuration={150}>
            <div className="flex items-center gap-2">
                {active_holiday && (
                    <Tooltip key="holiday" closeDelay={0}>
                        <TooltipTrigger className="cursor-help transition-all hover:scale-105 focus:outline-none">
                            <div className="relative flex h-8 w-8 items-center justify-center rounded-full border text-muted-foreground hover:text-emerald-500 bg-muted border-border shadow-sm">
                                <Palmtree className="h-4 w-4" />
                            </div>
                        </TooltipTrigger>
                        <TooltipContent
                            side="top"
                            align="center"
                            className="max-w-2xl min-w-[450px] overflow-hidden border-border/50 p-0 shadow-xl"
                        >
                            <div className="flex items-center gap-2 border-b border-border/50 px-4 py-3 bg-muted">
                                <p className="text-sm font-bold text-foreground">
                                    Szabadság
                                </p>
                            </div>
                            <div className="max-h-72 overflow-y-auto bg-popover">
                                <table className="w-full text-left text-sm">
                                    <thead className="sticky top-0 bg-muted/90 text-muted-foreground shadow-sm backdrop-blur-md">
                                        <tr>
                                            <th className="w-1/2 px-4 py-2.5 font-semibold">
                                                Indok
                                            </th>
                                            <th className="w-1/4 px-4 py-2.5 font-semibold">
                                                Kezdete
                                            </th>
                                            <th className="w-1/4 px-4 py-2.5 font-semibold">
                                                Vége
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/50">
                                        <tr className="group transition-colors hover:bg-muted/30">
                                            <td className="px-4 py-3 align-top font-medium text-foreground">
                                                <div
                                                    className="line-clamp-2 leading-relaxed"
                                                    title={active_holiday.reason}
                                                >
                                                    {active_holiday.reason || '-'}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 align-top text-muted-foreground">
                                                <div className="mt-0.5 flex items-center gap-1.5 whitespace-nowrap">
                                                    <Calendar className="h-3.5 w-3.5 shrink-0 opacity-50" />
                                                    {active_holiday.started_at
                                                        ? formatDate(active_holiday.started_at)
                                                        : '-'}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 align-top text-muted-foreground">
                                                <div className="mt-0.5 flex items-center gap-1.5 whitespace-nowrap">
                                                    <Calendar className="h-3.5 w-3.5 shrink-0 opacity-50" />
                                                    {active_holiday.ended_at
                                                        ? formatDate(active_holiday.ended_at)
                                                        : '-'}
                                                </div>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </TooltipContent>
                    </Tooltip>
                )}

                {sortedEntries.map(([type, items]: [string, any]) => {
                    const config = getPunishmentConfig(type);
                    const bgClass =
                        config.color.match(/bg-[^\s]+/g)?.join(' ') || '';

                    return (
                        <Tooltip key={type} closeDelay={0}>
                            <TooltipTrigger className="cursor-help transition-all hover:scale-105 focus:outline-none">
                                <div
                                    className={`relative flex h-8 w-8 items-center justify-center rounded-full border ${config.color} shadow-sm`}
                                >
                                    {config.icon}
                                    {items.length > 1 && (
                                        <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-[10px] font-bold text-background shadow-md ring-2 ring-background">
                                            {items.length}
                                        </span>
                                    )}
                                </div>
                            </TooltipTrigger>
                            <TooltipContent
                                side="top"
                                align="center"
                                className="max-w-2xl min-w-[450px] overflow-hidden border-border/50 p-0 shadow-xl"
                            >
                                <div
                                    className={`flex items-center gap-2 border-b border-border/50 px-4 py-3 ${bgClass}`}
                                >
                                    <p className="text-sm font-bold text-foreground">
                                        {config.label}{' '}
                                        <span className="font-medium opacity-70">
                                            - {items.length} db
                                        </span>
                                    </p>
                                </div>
                                <div className="max-h-72 overflow-y-auto bg-popover">
                                    <table className="w-full text-left text-sm">
                                        <thead className="sticky top-0 bg-muted/90 text-muted-foreground shadow-sm backdrop-blur-md">
                                            <tr>
                                                <th className="w-2/5 px-4 py-2.5 font-semibold">
                                                    Indok
                                                </th>
                                                <th className="w-1/5 px-4 py-2.5 font-semibold">
                                                    Kiosztó
                                                </th>
                                                <th className="w-1/5 px-4 py-2.5 font-semibold">
                                                    Dátum
                                                </th>
                                                <th className="w-1/5 px-4 py-2.5 font-semibold">
                                                    Lejárat
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/50">
                                            {items.map((p: any) => (
                                                <tr
                                                    key={p.id}
                                                    className="group transition-colors hover:bg-muted/30"
                                                >
                                                    <td className="px-4 py-3 align-top font-medium text-foreground">
                                                        <div
                                                            className="line-clamp-2 leading-relaxed"
                                                            title={p.reason}
                                                        >
                                                            {p.reason}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 align-top text-muted-foreground">
                                                        <div className="mt-0.5 flex items-center gap-1.5">
                                                            <User className="h-3.5 w-3.5 shrink-0 opacity-50" />
                                                            <span
                                                                className="max-w-[100px] truncate"
                                                                title={
                                                                    p
                                                                        .created_by_guild_user
                                                                        ?.ic_name ||
                                                                    p
                                                                        .created_by_user
                                                                        ?.name ||
                                                                    'Ismeretlen'
                                                                }
                                                            >
                                                                {p
                                                                    .created_by_guild_user
                                                                    ?.ic_name ||
                                                                    p
                                                                        .created_by_user
                                                                        ?.name ||
                                                                    'Ismeretlen'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 align-top text-muted-foreground">
                                                        <div className="mt-0.5 flex items-center gap-1.5 whitespace-nowrap">
                                                            <Calendar className="h-3.5 w-3.5 shrink-0 opacity-50" />
                                                            {formatDate(
                                                                p.created_at,
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 align-top text-muted-foreground">
                                                        <div className="mt-0.5 flex items-center gap-1.5 whitespace-nowrap">
                                                            <Calendar className="h-3.5 w-3.5 shrink-0 opacity-50" />
                                                            {formatDate(
                                                                p.expires_at,
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </TooltipContent>
                        </Tooltip>
                    );
                })}
            </div>
        </TooltipProvider>
    );
}
