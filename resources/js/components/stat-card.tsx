import type { ReactNode } from 'react';
import { Line, LineChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';

export interface ChartLineConfig {
    dataKey: string;
    color: string;
    label: string;
}

interface StatCardProps {
    title_text: string;
    stat_value: string | ReactNode;
    description_text?: string;
    icon_element?: ReactNode;
    chart_data?: any[];
    chart_lines?: ChartLineConfig[];
    on_refresh?: () => void;
    is_loading?: boolean;
    valueFormatter?: (value: number) => string;
    action_element?: ReactNode;
}

export function StatCard({
                             title_text,
                             stat_value,
                             description_text,
                             icon_element,
                             chart_data,
                             chart_lines,
                             on_refresh,
                             is_loading = false,
                             valueFormatter,
                             action_element,
                         }: StatCardProps) {
    return (
        <Card
            className={`relative flex flex-col overflow-hidden ${
                on_refresh && !is_loading
                    ? 'cursor-pointer transition-colors hover:bg-accent/50'
                    : ''
            }`}
            onClick={on_refresh && !is_loading ? on_refresh : undefined}
        >
            {is_loading && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-[2px]">
                    <Spinner className="h-6 w-6 text-primary" />
                </div>
            )}

            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    {title_text}
                </CardTitle>
                {icon_element}
            </CardHeader>
            <CardContent className="flex flex-1 flex-col">
                <div className="text-2xl font-bold">{stat_value}</div>
                {description_text && (
                    <p className="mt-1 text-xs text-muted-foreground">
                        {description_text}
                    </p>
                )}

                {/* Dinamikus Chart Renderelés */}
                {chart_data && chart_data.length > 0 && chart_lines && (
                    <div className="mt-4 h-[60px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chart_data}>
                                <Tooltip
                                    cursor={false}
                                    content={({ active, payload }) => {
                                        if (
                                            active &&
                                            payload &&
                                            payload.length
                                        ) {
                                            return (
                                                <div className="rounded-lg border bg-background p-2 shadow-sm">
                                                    <div className="mb-1 text-[0.70rem] text-muted-foreground uppercase">
                                                        {
                                                            payload[0].payload
                                                                .date
                                                        }
                                                    </div>
                                                    <div className="flex flex-col gap-1">
                                                        {payload.map(
                                                            (entry, index) => (
                                                                <div
                                                                    key={index}
                                                                    className="flex items-center justify-between gap-4 text-sm"
                                                                >
                                                                    <span
                                                                        style={{
                                                                            color: entry.color,
                                                                        }}
                                                                        className="font-medium"
                                                                    >
                                                                        {
                                                                            entry.name
                                                                        }
                                                                        :
                                                                    </span>
                                                                    <span className="font-bold">
                                                                        {valueFormatter
                                                                            ? valueFormatter(
                                                                                entry.value as number,
                                                                            )
                                                                            : `${entry.value}`}
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
                                {chart_lines.map((line, idx) => (
                                    <Line
                                        key={idx}
                                        type="monotone"
                                        dataKey={line.dataKey}
                                        name={line.label}
                                        stroke={line.color}
                                        strokeWidth={2}
                                        dot={false}
                                    />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Action Element megjelenítése (Gombok, stb) */}
                {action_element && (
                    <div
                        className="mt-4 flex flex-1 items-end pt-2"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {action_element}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
