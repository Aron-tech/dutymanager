import { Head, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import {
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ComposedChart,
    Line,
    Label,
    Legend,
} from 'recharts';
import AppLayout from '@/layouts/app-layout';
import { Input } from '@/components/ui/input';
import { Label as UiLabel } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDuty } from '@/lib/utils';
import { useDebounce } from '@/hooks/use-debounce';

interface DailyStat {
    date: string;
    active_users: number;
    avg_time: number;
}

interface TopUser {
    id: number;
    name: string;
    avatar_url: string | null;
    total_minutes: number;
}

interface StatisticsProps {
    statistics: {
        duty_distribution: {
            total: number;
            active: number;
            inactive: number;
            on_holiday: number;
        };
        punishment_distribution: Record<string, number>;
        top_users: TopUser[];
        daily_stats: DailyStat[];
        total_period_time: number;
    };
    days: number;
}

const PIE_COLORS = ['#10b981', '#ef4444', '#f59e0b'];
const BAR_COLORS = ['#3b82f6', '#f97316', '#8b5cf6', '#ec4899'];

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
    const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));

    if (percent < 0.05) return null;

    return (
        <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-xs font-bold pointer-events-none">
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

export default function Statistics({ statistics, days }: StatisticsProps) {
    const [daysFilter, setDaysFilter] = useState<number>(days);
    const debouncedDays = useDebounce(daysFilter, 500);

    useEffect(() => {
        if (debouncedDays !== days && debouncedDays > 0) {
            router.get(
                route('statistics'),
                { days: debouncedDays },
                { preserveState: true, preserveScroll: true },
            );
        }
    }, [debouncedDays, days]);

    const pieData = [
        { name: 'Aktív', value: statistics.duty_distribution.active },
        { name: 'Inaktív', value: statistics.duty_distribution.inactive },
        { name: 'Szabadságon', value: statistics.duty_distribution.on_holiday },
    ].filter((item) => item.value > 0);

    const barData = Object.entries(statistics.punishment_distribution).map(
        ([type, count]) => ({
            name: type,
            count: count,
        }),
    );

    return (
        <AppLayout breadcrumbs={[{ title: 'Statisztika', href: route('statistics') }]}>
            <Head title="Statisztika" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between rounded-lg border bg-card p-3 px-4 shadow-sm">
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-medium">Szűrési beállítások</span>
                        <div className="h-4 w-px bg-border"></div>
                        <span className="text-sm font-medium text-emerald-500">
                            Összesített Duty Idő: {formatDuty(statistics.total_period_time)}
                        </span>
                    </div>
                    <div className="flex items-center space-x-3">
                        <UiLabel htmlFor="days-filter" className="text-sm text-muted-foreground">
                            Vizsgált időszak (nap):
                        </UiLabel>
                        <Input
                            id="days-filter"
                            type="number"
                            min={1}
                            max={365}
                            value={daysFilter}
                            onChange={(e) => setDaysFilter(parseInt(e.target.value) || 1)}
                            className="h-8 w-24 text-center"
                        />
                    </div>
                </div>

                {/* Kombinált Napi Statisztika */}
                <div className="rounded-xl border bg-card p-6 shadow-sm">
                    <h3 className="mb-4 text-lg font-semibold tracking-tight">
                        Napi Aktivitás és Átlagos Idő ({days} nap)
                    </h3>
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={statistics.daily_stats} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                                <XAxis dataKey="date" tickLine={false} axisLine={false} className="text-xs" tickFormatter={(v) => v.slice(5)} />
                                <YAxis yAxisId="left" orientation="left" tickLine={false} axisLine={false} className="text-xs" allowDecimals={false} />
                                <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} className="text-xs" tickFormatter={(v) => formatDuty(v)} />
                                <Tooltip
                                    cursor={{ fill: 'hsl(var(--muted))' }}
                                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--background))' }}
                                    formatter={(value: number, name: string) => [name === 'Átlagos Idő' ? formatDuty(value) : value, name]}
                                    labelFormatter={(label) => `Dátum: ${label}`}
                                />
                                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                                <Bar yAxisId="left" dataKey="active_users" fill="#8b5cf6" name="Aktív Felhasználók (fő)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                <Line yAxisId="right" type="monotone" dataKey="avg_time" stroke="#10b981" strokeWidth={3} name="Átlagos Idő" dot={{ r: 4 }} activeDot={{ r: 6 }} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Duty Eloszlás */}
                    <div className="rounded-xl border bg-card p-6 shadow-sm">
                        <h3 className="mb-4 text-lg font-semibold tracking-tight">
                            Guild User Eloszlás ({days} nap)
                        </h3>
                        <div className="h-[300px] w-full">
                            {pieData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={70}
                                            outerRadius={110}
                                            paddingAngle={0}
                                            stroke="none"
                                            dataKey="value"
                                            labelLine={false}
                                            label={renderCustomizedLabel}
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                            ))}
                                            <Label
                                                value={statistics.duty_distribution.total}
                                                position="center"
                                                className="fill-foreground text-3xl font-bold"
                                            />
                                            <Label
                                                value="Összes Tag"
                                                position="center"
                                                dy={20}
                                                className="fill-muted-foreground text-xs"
                                            />
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: 'hsl(var(--background))' }}
                                            itemStyle={{ color: 'hsl(var(--foreground))' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                                    Nincs elegendő adat a megjelenítéshez.
                                </div>
                            )}
                        </div>
                        <div className="mt-4 flex flex-wrap justify-center gap-4 text-sm">
                            {pieData.map((entry, index) => (
                                <div key={entry.name} className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                                    <span>{entry.name}: <strong className="text-foreground">{entry.value}</strong></span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Büntetés Eloszlás */}
                    <div className="rounded-xl border bg-card p-6 shadow-sm">
                        <h3 className="mb-4 text-lg font-semibold tracking-tight">
                            Büntetések Eloszlása ({days} nap)
                        </h3>
                        <div className="h-[300px] w-full">
                            {barData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={barData} margin={{ top: 20, right: 0, left: -20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                                        <XAxis dataKey="name" tickLine={false} axisLine={false} className="text-xs uppercase" />
                                        <YAxis allowDecimals={false} tickLine={false} axisLine={false} className="text-xs" />
                                        <Tooltip
                                            cursor={{ fill: 'hsl(var(--muted))' }}
                                            contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--background))' }}
                                        />
                                        <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Darab" maxBarSize={50}>
                                            {barData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                                    Nem történt büntetés az adott időszakban.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Top 10 Felhasználó */}
                <div className="rounded-xl border bg-card shadow-sm mb-10">
                    <div className="border-b p-6">
                        <h3 className="text-lg font-semibold tracking-tight">
                            Top 10 Legaktívabb Felhasználó ({days} nap)
                        </h3>
                    </div>
                    <div className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[80px] text-center">Hely.</TableHead>
                                    <TableHead>Név</TableHead>
                                    <TableHead className="text-right">Összesített Idő</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {statistics.top_users.length > 0 ? (
                                    statistics.top_users.map((user, index) => (
                                        <TableRow key={user.id}>
                                            <TableCell className="text-center font-bold text-muted-foreground">
                                                {index + 1}.
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage src={user.avatar_url || ''} />
                                                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <span className="font-medium text-foreground">{user.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-medium text-emerald-600 dark:text-emerald-500">
                                                {formatDuty(user.total_minutes)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                                            Nincs regisztrált duty az adott időszakban.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
