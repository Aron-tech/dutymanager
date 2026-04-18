import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import {
    Activity,
    Calendar,
    Clock,
    ShieldAlert,
    Users,
    Settings2,
    Loader2,
    LogOut,
    LogIn,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import {
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { toast } from 'sonner';
import { StatCard } from '@/components/stat-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { formatDuty } from '@/lib/utils';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

interface ChartDataPoint {
    date: string;
    current_value: number;
    all_value: number;
    guild_avg: number;
}

interface DashboardProps {
    guild_user_id: number;
    active_duties_count: number;
    has_active_duty: boolean;
    current_total_duty_time: number;
    total_duty_time: number;
    in_guild_days: number;
    duty_chart_data: ChartDataPoint[];
    stats_days: number;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard() },
];

export default function Dashboard({
    guild_user_id,
    active_duties_count,
    has_active_duty,
    current_total_duty_time,
    total_duty_time,
    in_guild_days,
    duty_chart_data,
    stats_days,
}: DashboardProps) {
    const [refreshing_card, setRefreshingCard] = useState<string | null>(null);
    const [daysFilter, setDaysFilter] = useState<number>(stats_days);
    const [isTogglingDuty, setIsTogglingDuty] = useState<boolean>(false);

    useEffect(() => {
        if (daysFilter === stats_days || daysFilter < 7 || daysFilter > 30) {
            return;
        }

        const timeoutId = setTimeout(() => {
            router.get(
                dashboard(),
                { stats: daysFilter },
                { preserveState: true, preserveScroll: true },
            );
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [daysFilter, stats_days]);

    const refreshData = (prop_keys: string[], card_id: string) => {
        setRefreshingCard(card_id);
        router.reload({
            only: prop_keys,
            preserveScroll: true,
            preserveState: true,
            onFinish: () => setRefreshingCard(null),
        });
    };

    const handleToggleDuty = async () => {
        setIsTogglingDuty(true);

        try {
            const response = await axios.post(
                route('duty.toggle', { guild_user: guild_user_id }),
            );

            const { success, message } = response.data;

            if (success) {
                if (message) {
                    toast.success(message);
                }

                router.reload({
                    only: [
                        'has_active_duty',
                        'active_duties_count',
                        'current_total_duty_time',
                        'duty_chart_data',
                    ],
                    preserveScroll: true,
                    preserveState: true,
                });
            } else {
                toast.error(message || 'Hiba történt a művelet során.');
            }
        } catch (error: any) {
            toast.error(
                error.message ||
                    'Kiszolgáló hiba történt az állapot módosításakor.',
            );
        } finally {
            setIsTogglingDuty(false);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between rounded-lg border bg-card p-3 px-4 shadow-sm">
                    <div className="flex items-center space-x-2">
                        <Settings2 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                            Statisztika nézet
                        </span>
                    </div>
                    <div className="flex items-center space-x-3">
                        <Label
                            htmlFor="days-filter"
                            className="text-sm text-muted-foreground"
                        >
                            Intervallum (nap):
                        </Label>
                        <Input
                            id="days-filter"
                            type="number"
                            min={7}
                            max={30}
                            value={daysFilter}
                            onChange={(e) =>
                                setDaysFilter(parseInt(e.target.value) || 7)
                            }
                            className="h-8 w-20 text-center"
                        />
                    </div>
                </div>

                <div className="grid auto-rows-min gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title_text="Jelenlegi Státusz"
                        stat_value={
                            has_active_duty ? (
                                <Badge className="bg-green-500 hover:bg-green-600">
                                    Szolgálatban
                                </Badge>
                            ) : (
                                <Badge variant="secondary">Inaktív</Badge>
                            )
                        }
                        description_text="Saját aktív szolgálati állapotod."
                        icon_element={
                            <Activity className="h-4 w-4 text-muted-foreground" />
                        }
                        action_element={
                            <Button
                                variant={
                                    has_active_duty ? 'destructive' : 'default'
                                }
                                className="w-full shadow-sm"
                                onClick={handleToggleDuty}
                                disabled={isTogglingDuty}
                            >
                                {isTogglingDuty ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : has_active_duty ? (
                                    <LogOut className="mr-2 h-4 w-4" />
                                ) : (
                                    <LogIn className="mr-2 h-4 w-4" />
                                )}
                                {has_active_duty
                                    ? 'Szolgálat leadása'
                                    : 'Szolgálat felvétele'}
                            </Button>
                        }
                    />

                    <StatCard
                        title_text="Jelenlegi Időszak"
                        stat_value={formatDuty(current_total_duty_time)}
                        description_text={`Az elmúlt ${stats_days} nap aktivitása alapján.`}
                        chart_data={duty_chart_data}
                        chart_lines={[
                            {
                                dataKey: 'current_value',
                                color: '#10b981',
                                label: 'Jelenlegi',
                            },
                        ]}
                        valueFormatter={formatDuty}
                        on_refresh={() =>
                            refreshData(
                                ['current_total_duty_time', 'duty_chart_data'],
                                'current_period',
                            )
                        }
                        is_loading={refreshing_card === 'current_period'}
                        icon_element={
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        }
                    />

                    <StatCard
                        title_text="Összes Szolgálati Idő"
                        stat_value={formatDuty(total_duty_time)}
                        description_text={`A teljes historikus adat ${stats_days} napra vetítve.`}
                        chart_data={duty_chart_data}
                        chart_lines={[
                            {
                                dataKey: 'all_value',
                                color: '#3b82f6',
                                label: 'Összesített',
                            },
                        ]}
                        valueFormatter={formatDuty}
                        on_refresh={() =>
                            refreshData(
                                ['total_duty_time', 'duty_chart_data'],
                                'total_period',
                            )
                        }
                        is_loading={refreshing_card === 'total_period'}
                        icon_element={
                            <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                        }
                    />

                    <div className="flex flex-col gap-4">
                        <StatCard
                            title_text="Szerveren Töltött Idő"
                            stat_value={`${in_guild_days} nap`}
                            icon_element={
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                            }
                        />
                        <StatCard
                            title_text="Globális Aktív Duty"
                            stat_value={`${active_duties_count} fő`}
                            on_refresh={() =>
                                refreshData(
                                    ['active_duties_count'],
                                    'global_active',
                                )
                            }
                            is_loading={refreshing_card === 'global_active'}
                            icon_element={
                                <Users className="h-4 w-4 text-muted-foreground" />
                            }
                        />
                    </div>
                </div>

                <div className="relative flex min-h-[400px] flex-1 flex-col overflow-hidden rounded-xl border border-sidebar-border/70 bg-card p-6 shadow-sm dark:border-sidebar-border">
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold tracking-tight">
                                Összehasonlító Analízis
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Saját teljes szolgálati idő vs. a szerver aktív
                                tagjainak napi átlaga.
                            </p>
                        </div>
                    </div>

                    <div className="min-h-[300px] w-full flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                                data={duty_chart_data}
                                margin={{
                                    top: 10,
                                    right: 10,
                                    left: -20,
                                    bottom: 0,
                                }}
                            >
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    vertical={false}
                                    className="stroke-muted"
                                />
                                <XAxis
                                    dataKey="date"
                                    className="text-xs text-muted-foreground"
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => value.slice(5)}
                                    dy={10}
                                />
                                <YAxis
                                    className="text-xs text-muted-foreground"
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => formatDuty(value)}
                                />
                                <Tooltip
                                    cursor={{
                                        stroke: 'hsl(var(--muted-foreground))',
                                        strokeWidth: 1,
                                        strokeDasharray: '4 4',
                                    }}
                                    content={({ active, payload, label }) => {
                                        if (
                                            active &&
                                            payload &&
                                            payload.length
                                        ) {
                                            return (
                                                <div className="rounded-lg border bg-background p-3 shadow-md">
                                                    <p className="mb-2 text-[0.8rem] font-medium text-muted-foreground uppercase">
                                                        {label}
                                                    </p>
                                                    <div className="flex flex-col gap-2">
                                                        {payload.map(
                                                            (entry, index) => (
                                                                <div
                                                                    key={index}
                                                                    className="flex items-center justify-between gap-6 text-sm"
                                                                >
                                                                    <div className="flex items-center gap-2">
                                                                        <div
                                                                            className="h-2 w-2 rounded-full"
                                                                            style={{
                                                                                backgroundColor:
                                                                                    entry.color,
                                                                            }}
                                                                        />
                                                                        <span className="font-medium text-foreground">
                                                                            {
                                                                                entry.name
                                                                            }
                                                                            :
                                                                        </span>
                                                                    </div>
                                                                    <span className="font-bold">
                                                                        {formatDuty(
                                                                            entry.value as number,
                                                                        )}
                                                                    </span>
                                                                </div>
                                                            ),
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        }

                                        return null;
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="all_value"
                                    name="Saját (Összes)"
                                    stroke="#10b981"
                                    strokeWidth={3}
                                    dot={false}
                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="guild_avg"
                                    name="Szerver napi átlag"
                                    stroke="#3b82f6"
                                    strokeWidth={3}
                                    dot={false}
                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
