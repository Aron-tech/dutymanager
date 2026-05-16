// activity-logs/index.tsx
import { Head, router, usePage } from '@inertiajs/react';
import React, {
    useState,
    useMemo,
    useEffect,
    useCallback,
    useRef,
} from 'react';
import { toast } from 'sonner';
import { DataTable } from '@/components/data-table';
import type { ColumnDef } from '@/components/data-table';
import { DataTableToolbar } from '@/components/data-table-toolbar';
import { Badge } from '@/components/ui/badge'; // <-- Hozzáadtuk a Badge komponenst
import { Button } from '@/components/ui/button';
import { useDebounce } from '@/hooks/use-debounce';
import AppLayout from '@/layouts/app-layout';
import { formatDate } from '@/lib/utils';

interface ActivityLog {
    id: number;
    user_id: string | null;
    target_id: string | null;
    action: string;
    details: any;
    formatted_description?: string; // <-- Új formázott leírás
    created_at: string;
    actor?: { id: string; name: string };
    target?: { id: string; name: string };
}

const default_logs = {
    data: [],
    links: [],
    total: 0,
    per_page: 15,
    last_page: 1,
};

interface PageProps {
    logs?: {
        data: ActivityLog[];
        links: any[];
        total: number;
        per_page: number;
        last_page: number;
    };
    filters?: {
        search?: string;
        per_page?: string;
        sort?: string;
        direction?: string;
        date_from?: string;
        date_to?: string;
    };
    available_actions?: Record<string, string>;
}

export default function ActivityLogsIndexView({
    logs = default_logs,
    filters = {},
    available_actions = {},
}: PageProps) {
    const { props } = usePage();
    const flash = props.flash as {
        success: string | null;
        error: string | null;
    };

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }

        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    const safe_filters = Array.isArray(filters) ? {} : filters || {};

    const [search_query, setSearchQuery] = useState(safe_filters.search || '');
    const debounced_search = useDebounce(search_query, 400);
    const [per_page_amount, setPerPageAmount] = useState(
        safe_filters.per_page || String(logs?.per_page || 15),
    );
    const [custom_per_page, setCustomPerPage] = useState('');
    const [sort_column, setSortColumn] = useState(
        safe_filters.sort || 'created_at',
    );
    const [sort_direction, setSortDirection] = useState(
        safe_filters.direction || 'desc',
    );
    const [date_from, setDateFrom] = useState(safe_filters.date_from || '');
    const [date_to, setDateTo] = useState(safe_filters.date_to || '');

    const column_definitions = useMemo(
        () => [
            { id: 'action', label: 'Művelet', required: true },
            { id: 'actor_discord_name', label: 'Végrehajtó', required: true },
            { id: 'target_discord_name', label: 'Célpont', required: false },
            { id: 'formatted_description', label: 'Részletek', required: true },
            { id: 'created_at', label: 'Dátum', required: true },
            { id: 'actor_discord_id', label: 'Végrehajtó ID', required: false },
            { id: 'target_discord_id', label: 'Célpont ID', required: false },
        ],
        [],
    );

    const [visible_columns, setVisibleColumns] = useState<string[]>([
        'action',
        'actor_discord_name',
        'target_discord_name',
        'formatted_description',
        'created_at',
    ]);

    const is_mounted = useRef(false);

    const fetchFilteredData = useCallback(
        (
            search: string,
            limit: string,
            sort: string,
            dir: string,
            from?: string,
            to?: string,
        ) => {
            const query_params: any = { per_page: limit, sort, direction: dir };

            if (search) {
                query_params.search = search;
            }

            if (from) {
                query_params.date_from = from;
            }

            if (to) {
                query_params.date_to = to;
            }

            router.get(route('activity-log.index'), query_params, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        },
        [],
    );

    useEffect(() => {
        if (!is_mounted.current) {
            is_mounted.current = true;

            return;
        }

        fetchFilteredData(
            debounced_search,
            per_page_amount,
            sort_column,
            sort_direction,
            date_from,
            date_to,
        );
    }, [debounced_search, date_from, date_to]);

    const handlePerPageChange = (val: string) => {
        if (val !== 'custom') {
            setPerPageAmount(val);
            setCustomPerPage('');
            fetchFilteredData(
                debounced_search,
                val,
                sort_column,
                sort_direction,
                date_from,
                date_to,
            );
        } else {
            setPerPageAmount('custom');
        }
    };

    const handleCustomPerPageSubmit = (
        e: React.KeyboardEvent<HTMLInputElement>,
    ) => {
        if (e.key === 'Enter' && custom_per_page) {
            fetchFilteredData(
                debounced_search,
                custom_per_page,
                sort_column,
                sort_direction,
                date_from,
                date_to,
            );
        }
    };

    const handleSort = (col_id: string) => {
        const new_dir =
            sort_column === col_id && sort_direction === 'asc' ? 'desc' : 'asc';
        setSortColumn(col_id);
        setSortDirection(new_dir);
        fetchFilteredData(
            debounced_search,
            per_page_amount,
            col_id,
            new_dir,
            date_from,
            date_to,
        );
    };

    const toggleColumnVisibility = (col_id: string) => {
        setVisibleColumns((prev) =>
            prev.includes(col_id)
                ? prev.filter((id) => id !== col_id)
                : [...prev, col_id],
        );
    };

    const table_columns = useMemo<ColumnDef<ActivityLog>[]>(() => {
        return column_definitions
            .filter((col) => visible_columns.includes(col.id))
            .map((col) => {
                let render_func;

                if (col.id === 'actor_discord_id') {
                    render_func = (row: ActivityLog) =>
                        row.actor?.id || row.user_id || 'Rendszer / Ismeretlen';
                } else if (col.id === 'actor_discord_name') {
                    render_func = (row: ActivityLog) => {
                        if (!row.actor) {
                            return row.user_id ? 'Ismeretlen' : 'Rendszer';
                        }

                        return (
                            <span className="font-semibold text-foreground">
                                {row.actor.name || 'Ismeretlen'}
                            </span>
                        );
                    };
                } else if (col.id === 'target_discord_id') {
                    render_func = (row: ActivityLog) =>
                        row.target?.id || row.target_id || '-';
                } else if (col.id === 'target_discord_name') {
                    render_func = (row: ActivityLog) => {
                        if (!row.target) {
                            return row.target_id ? 'Ismeretlen' : '-';
                        }

                        return (
                            <span className="font-semibold text-foreground">
                                {row.target.name || 'Ismeretlen'}
                            </span>
                        );
                    };
                } else if (col.id === 'action') {
                    render_func = (row: ActivityLog) => (
                        <div className="font-semibold">
                            {available_actions[row.action] || row.action}
                        </div>
                    );
                } else if (col.id === 'formatted_description') {
                    render_func = (row: ActivityLog) => {
                        return (
                            <div className="max-w-md text-sm break-words whitespace-normal">
                                {row.formatted_description || '-'}
                            </div>
                        );
                    };
                } else if (col.id === 'created_at') {
                    render_func = (row: ActivityLog) => (
                        <span className="whitespace-nowrap">
                            {formatDate(row.created_at, '')}
                        </span>
                    );
                }

                return {
                    id: col.id,
                    label: col.label,
                    sortable: true,
                    render: render_func,
                };
            });
    }, [column_definitions, visible_columns, available_actions]);

    return (
        <AppLayout>
            <Head title="Aktivitás Napló" />
            <div className="container mx-auto space-y-6 px-4 py-8">
                <div>
                    <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
                        Aktivitás Napló
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Szerveren történt események naplója. Összesen:{' '}
                        {logs?.total || 0} bejegyzés.
                    </p>
                </div>

                <div className="mt-8 mb-4 flex w-full flex-col gap-4">
                    <DataTableToolbar
                        search_query={search_query}
                        onSearchChange={setSearchQuery}
                        columns={column_definitions}
                        visible_columns={visible_columns}
                        onToggleColumn={toggleColumnVisibility}
                        per_page_amount={per_page_amount}
                        onPerPageChange={handlePerPageChange}
                        custom_per_page={custom_per_page}
                        onCustomPerPageChange={setCustomPerPage}
                        onCustomPerPageSubmit={handleCustomPerPageSubmit}
                        show_date_filter={true}
                        date_from={date_from}
                        onDateFromChange={setDateFrom}
                        date_to={date_to}
                        onDateToChange={setDateTo}
                    />
                </div>

                <div className="rounded-md border bg-background shadow-sm">
                    <DataTable<ActivityLog>
                        data={logs?.data || []}
                        columns={table_columns}
                        key_field="id"
                        selected_rows={[]}
                        onSelectionChange={() => {}}
                        is_row_selectable={() => false}
                        sort_column={sort_column}
                        sort_direction={sort_direction as 'asc' | 'desc'}
                        onSort={handleSort}
                        empty_message="Nincs megjeleníthető napló bejegyzés."
                    />
                </div>

                {(logs?.last_page || 1) > 1 && (
                    <div className="flex justify-center gap-2 pt-4">
                        {(logs?.links || []).map((link, i) => (
                            <Button
                                key={i}
                                variant={link.active ? 'default' : 'outline'}
                                size="sm"
                                disabled={!link.url}
                                onClick={() =>
                                    link.url &&
                                    router.get(
                                        link.url,
                                        {},
                                        {
                                            preserveState: true,
                                            preserveScroll: true,
                                        },
                                    )
                                }
                                dangerouslySetInnerHTML={{
                                    __html: link.label || '',
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
