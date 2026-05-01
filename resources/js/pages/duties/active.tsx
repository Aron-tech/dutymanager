import { Head, router } from '@inertiajs/react';
import { LogOut, Users } from 'lucide-react';
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { DataTable } from '@/components/data-table';
import type { ColumnDef } from '@/components/data-table';
import { DataTableToolbar } from '@/components/data-table-toolbar';
import { StatCard } from '@/components/stat-card';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useDebounce } from '@/hooks/use-debounce';
import AppLayout from '@/layouts/app-layout';
import { formatDate } from '@/lib/utils';
import type { Duty } from '@/types';

const default_duties = {
    data: [],
    links: [],
    total: 0,
    per_page: 20,
    last_page: 1,
};

interface PageProps {
    active_duties?: {
        data: Duty[];
        links: any[];
        total: number;
        per_page: number;
        last_page: number;
    };
    current_active_count?: number;
    chart_data?: { date: string; count: number }[];
    filters?: {
        search?: string;
        per_page?: string;
        sort?: string;
        direction?: string;
    };
}

export default function ActiveDutiesView({
                                             active_duties = default_duties,
                                             current_active_count = 0,
                                             chart_data = [],
                                             filters = {},
                                         }: PageProps) {
    const safe_filters = Array.isArray(filters) ? {} : filters || {};

    const [search_query, setSearchQuery] = useState(safe_filters.search || '');
    const debounced_search = useDebounce(search_query, 400);
    const [per_page_amount, setPerPageAmount] = useState(
        safe_filters.per_page || String(active_duties?.per_page || 20)
    );
    const [custom_per_page, setCustomPerPage] = useState('');
    const [sort_column, setSortColumn] = useState(safe_filters.sort || 'started_at');
    const [sort_direction, setSortDirection] = useState(safe_filters.direction || 'desc');

    const [selected_rows, setSelectedRows] = useState<(string | number)[]>([]);
    const [is_refreshing, setIsRefreshing] = useState(false);

    const [delete_state, setDeleteState] = useState<{
        is_open: boolean;
        is_bulk: boolean;
        ids: (string | number)[];
        is_processing: boolean;
    }>({ is_open: false, is_bulk: false, ids: [], is_processing: false });

    const column_definitions = useMemo(() => [
        { id: 'discord_id', label: 'Discord ID', required: true },
        { id: 'discord_name', label: 'Discord Név', required: true },
        { id: 'ic_name', label: 'IC Név', required: true },
        { id: 'started_at', label: 'Szolgálatba lépés', required: true },
    ], []);

    const [visible_columns, setVisibleColumns] = useState<string[]>(
        column_definitions.map((c) => c.id)
    );

    const is_mounted = useRef(false);

    const fetchFilteredData = useCallback(
        (search: string, limit: string, sort: string, dir: string) => {
            const queryParams: any = {
                per_page: limit,
                sort,
                direction: dir,
            };

            if (search) {
                queryParams.search = search;
            }

            router.get(route('duty.active'), queryParams, {
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

    const handleRefresh = useCallback(() => {
        setIsRefreshing(true);
        router.reload({
            only: ['active_duties', 'current_active_count', 'chart_data'],
            onFinish: () => setIsRefreshing(false),
        });
    }, []);

    const confirmDelete = () => {
        setDeleteState((prev) => ({ ...prev, is_processing: true }));

        const inertia_options = {
            preserveScroll: true,
            onSuccess: () => {
                setSelectedRows([]);
                setDeleteState({ is_open: false, is_bulk: false, ids: [], is_processing: false });
                toast.success('Sikeres kiléptetés.');
                handleRefresh();
            },
            onError: () => {
                setDeleteState((prev) => ({ ...prev, is_processing: false }));
                toast.error('Hiba történt a kiléptetés során.');
            },
        };

        if (delete_state.is_bulk) {
            router.delete(route('duty.bulk.delete'), {
                data: { duty_ids: delete_state.ids },
                ...inertia_options
            });
        } else {
            router.delete(route('duty.delete', delete_state.ids[0]), inertia_options);
        }
    };

    const table_columns = useMemo<ColumnDef<Duty>[]>(() => {
        return column_definitions
            .filter((col) => visible_columns.includes(col.id))
            .map((col) => {
                let render_func;

                if (col.id === 'discord_id') {
                    render_func = (row: Duty) => <span className="font-mono">{row.guild_user?.user_id || '-'}</span>;
                } else if (col.id === 'discord_name') {
                    render_func = (row: Duty) => (
                        <span className="font-medium">{row.guild_user?.user?.name || '-'}</span>
                    );
                } else if (col.id === 'ic_name') {
                    render_func = (row: Duty) => (
                        <span className="font-semibold text-foreground">{row.guild_user?.ic_name || '-'}</span>
                    );
                } else if (col.id === 'started_at') {
                    render_func = (row: Duty) => formatDate(row.started_at, '');
                }

                return {
                    id: col.id,
                    label: col.label,
                    sortable: true,
                    render: render_func,
                };
            });
    }, [column_definitions, visible_columns]);

    const renderActions = useCallback((row: Duty) => {
        return (
            <div className="flex justify-end">
                <TooltipProvider delayDuration={200}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:bg-destructive/10"
                                onClick={() => setDeleteState({ is_open: true, is_bulk: false, ids: [row.id], is_processing: false })}
                            >
                                <LogOut className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Kiléptetés</TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
        );
    }, []);

    return (
        <AppLayout>
            <Head title="Aktív Szolgálatok" />
            <div className="container mx-auto space-y-6 px-4 py-8">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">Aktív Szolgálatok</h2>
                    <p className="text-sm text-muted-foreground">Jelenleg szolgálatban lévő felhasználók listája és kiléptetése.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3">
                    <StatCard
                        title_text="Jelenleg Szolgálatban"
                        stat_value={`${current_active_count} fő`}
                        description_text="Az elmúlt 24 óra alakulása"
                        icon_element={<Users className="h-5 w-5" />}
                        chart_data={chart_data}
                        chart_lines={[{ dataKey: 'count', color: 'hsl(var(--primary))', label: 'Létszám' }]}
                        on_refresh={handleRefresh}
                        is_loading={is_refreshing}
                    />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-8">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4 flex-1">
                        {selected_rows.length > 0 && (
                            <div className="flex shrink-0 items-center gap-2 bg-muted/50 p-1.5 rounded-md border">
                                <span className="text-sm font-medium px-2">{selected_rows.length} elem kijelölve</span>

                                <Button
                                    variant="destructive"
                                    size="sm"
                                    className="h-8"
                                    onClick={() => setDeleteState({ is_open: true, is_bulk: true, ids: selected_rows, is_processing: false })}
                                >
                                    <LogOut className="mr-2 h-4 w-4" /> Tömeges kiléptetés
                                </Button>
                            </div>
                        )}

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
                    <DataTable<Duty>
                        data={active_duties?.data || []}
                        columns={table_columns}
                        key_field="id"
                        selected_rows={selected_rows}
                        onSelectionChange={setSelectedRows}
                        sort_column={sort_column}
                        sort_direction={sort_direction as 'asc' | 'desc'}
                        onSort={handleSort}
                        actions={renderActions}
                        empty_message="Jelenleg senki sincs szolgálatban."
                    />
                </div>

                {(active_duties?.last_page || 1) > 1 && (
                    <div className="flex justify-center gap-2 pt-4">
                        {(active_duties?.links || []).map((link, i) => (
                            <Button
                                key={i}
                                variant={link.active ? 'default' : 'outline'}
                                size="sm"
                                disabled={!link.url}
                                onClick={() =>
                                    link.url &&
                                    router.get(
                                        link.url,
                                        {
                                            search: debounced_search,
                                            per_page: per_page_amount,
                                            sort: sort_column,
                                            direction: sort_direction,
                                        },
                                        { preserveScroll: true }
                                    )
                                }
                                dangerouslySetInnerHTML={{ __html: link.label || '' }}
                            />
                        ))}
                    </div>
                )}
            </div>

            <ConfirmDeleteDialog
                isOpen={delete_state.is_open}
                onClose={() => setDeleteState((prev) => ({ ...prev, is_open: false }))}
                onConfirm={confirmDelete}
                isProcessing={delete_state.is_processing}
                title="Kiléptetés megerősítése"
                confirmText="Kiléptetés"
                description={
                    delete_state.is_bulk
                        ? `Biztosan ki szeretnéd léptetni a kijelölt ${delete_state.ids.length} felhasználót? A művelet törli a bejegyzéseket.`
                        : "Biztosan ki szeretnéd léptetni ezt a felhasználót? A művelet törli a bejegyzést."
                }
            />
        </AppLayout>
    );
}
