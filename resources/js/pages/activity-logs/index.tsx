import { Head, router, usePage } from '@inertiajs/react';
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { DataTable } from '@/components/data-table';
import type { ColumnDef } from '@/components/data-table';
import { DataTableToolbar } from '@/components/data-table-toolbar';
import { useDebounce } from '@/hooks/use-debounce';
import AppLayout from '@/layouts/app-layout';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ActivityLog {
    id: number;
    user_id: string | null;
    target_id: string | null;
    action: string;
    details: any;
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
    };
    available_actions?: Record<string, string>;
}

export default function ActivityLogsIndexView({
                                                  logs = default_logs,
                                                  filters = {},
                                                  available_actions = {},
                                              }: PageProps) {
    const { props } = usePage();
    const flash = props.flash as { success: string | null; error: string | null; };

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    const safe_filters = Array.isArray(filters) ? {} : filters || {};

    const [search_query, setSearchQuery] = useState(safe_filters.search || '');
    const debounced_search = useDebounce(search_query, 400);
    const [per_page_amount, setPerPageAmount] = useState(
        safe_filters.per_page || String(logs?.per_page || 15)
    );
    const [custom_per_page, setCustomPerPage] = useState('');
    const [sort_column, setSortColumn] = useState(safe_filters.sort || 'created_at');
    const [sort_direction, setSortDirection] = useState(safe_filters.direction || 'desc');

    const column_definitions = useMemo(() => [
        { id: 'action', label: 'Művelet', required: true },
        { id: 'actor_discord_name', label: 'Végrehajtó Név', required: true },
        { id: 'actor_discord_id', label: 'Végrehajtó ID', required: true },
        { id: 'target_discord_name', label: 'Célpont Név', required: true },
        { id: 'target_discord_id', label: 'Célpont ID', required: true },
        { id: 'created_at', label: 'Dátum', required: true },
    ], []);

    const [visible_columns, setVisibleColumns] = useState<string[]>(
        column_definitions.map((c) => c.id)
    );

    const is_mounted = useRef(false);

    const fetchFilteredData = useCallback(
        (search: string, limit: string, sort: string, dir: string) => {
            const query_params: any = {
                per_page: limit,
                sort,
                direction: dir,
            };

            if (search) {
                query_params.search = search;
            }

            router.get(route('activity-log.index'), query_params, {
                preserveState: true,
                preserveScroll: true,
                replace: true
            });
        },
        []
    );

    useEffect(() => {
        if (!is_mounted.current) {
            is_mounted.current = true;
            return;
        }

        fetchFilteredData(debounced_search, per_page_amount, sort_column, sort_direction);
    }, [debounced_search]);

    const handlePerPageChange = (val: string) => {
        if (val !== 'custom') {
            setPerPageAmount(val);
            setCustomPerPage('');
            fetchFilteredData(debounced_search, val, sort_column, sort_direction);
        } else {
            setPerPageAmount('custom');
        }
    };

    const handleCustomPerPageSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && custom_per_page) {
            fetchFilteredData(debounced_search, custom_per_page, sort_column, sort_direction);
        }
    };

    const handleSort = (col_id: string) => {
        const new_dir = sort_column === col_id && sort_direction === 'asc' ? 'desc' : 'asc';
        setSortColumn(col_id);
        setSortDirection(new_dir);
        fetchFilteredData(debounced_search, per_page_amount, col_id, new_dir);
    };

    const toggleColumnVisibility = (col_id: string) => {
        setVisibleColumns((prev) =>
            prev.includes(col_id) ? prev.filter((id) => id !== col_id) : [...prev, col_id]
        );
    };

    const table_columns = useMemo<ColumnDef<ActivityLog>[]>(() => {
        return column_definitions
            .filter((col) => visible_columns.includes(col.id))
            .map((col) => {
                let render_func;

                if (col.id === 'actor_discord_id') {
                    render_func = (row: ActivityLog) => row.actor?.id || row.user_id || 'Rendszer / Ismeretlen';
                } else if (col.id === 'actor_discord_name') {
                    render_func = (row: ActivityLog) => {
                        if (!row.actor) return row.user_id ? 'Ismeretlen' : 'Rendszer';
                        return (
                            <div className="flex flex-col">
                                <span className="font-semibold text-foreground">
                                    {row.actor.name || 'Ismeretlen'}
                                </span>
                            </div>
                        );
                    };
                } else if (col.id === 'target_discord_id') {
                    render_func = (row: ActivityLog) => row.target?.id || row.target_id || '-';
                } else if (col.id === 'target_discord_name') {
                    render_func = (row: ActivityLog) => {
                        if (!row.target) return row.target_id ? 'Ismeretlen' : '-';
                        return (
                            <div className="flex flex-col">
                                <span className="font-semibold text-foreground">
                                    {row.target.name || 'Ismeretlen'}
                                </span>
                            </div>
                        );
                    };
                } else if (col.id === 'action') {
                    render_func = (row: ActivityLog) => (
                        <span className="font-medium">
                            {available_actions[row.action] || row.action}
                        </span>
                    );
                } else if (col.id === 'created_at') {
                    render_func = (row: ActivityLog) => formatDate(row.created_at, '');
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
                    <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        Aktivitás Napló
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">Szerveren történt események naplója. Összesen: {logs?.total || 0} bejegyzés.</p>
                </div>

                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mt-8">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4 flex-1">
                        <div className="w-full flex-1">
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
                            />
                        </div>
                    </div>
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
                                            preserveScroll: true
                                        }
                                    )
                                }
                                dangerouslySetInnerHTML={{ __html: link.label || '' }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
