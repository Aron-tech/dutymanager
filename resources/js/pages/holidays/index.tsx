import { Head, router, usePage } from '@inertiajs/react';
import { Trash2 } from 'lucide-react';
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { DataTable } from '@/components/data-table';
import type { ColumnDef } from '@/components/data-table';
import { DataTableToolbar } from '@/components/data-table-toolbar';
import { Badge } from '@/components/ui/badge';
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
import type { GuildUser } from '@/types';

interface Holiday {
    id: number;
    guild_id: string;
    guild_user_id: number;
    user_id: string;
    reason: string;
    started_at: string;
    ended_at: string;
    created_at: string;
    deleted_at: string | null;
    guild_user?: GuildUser;
}

const defaultHolidays = {
    data: [],
    links: [],
    total: 0,
    per_page: 15,
    last_page: 1,
};

interface PageProps {
    holidays?: {
        data: Holiday[];
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
}

export default function HolidaysIndexView({
                                                 holidays = defaultHolidays,
                                                 filters = {},
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
        safe_filters.per_page || String(holidays?.per_page || 15)
    );
    const [custom_per_page, setCustomPerPage] = useState('');
    const [sort_column, setSortColumn] = useState(safe_filters.sort || 'started_at');
    const [sort_direction, setSortDirection] = useState(safe_filters.direction || 'desc');

    const [selected_rows, setSelectedRows] = useState<(string | number)[]>([]);

    const [delete_state, setDeleteState] = useState<{
        is_open: boolean;
        is_bulk: boolean;
        ids: (string | number)[];
        is_processing: boolean;
    }>({ is_open: false, is_bulk: false, ids: [], is_processing: false });

    const column_definitions = useMemo(() => [
        { id: 'discord_id', label: 'Discord ID', required: true },
        { id: 'discord_name', label: 'Discord Név', required: true },
        { id: 'reason', label: 'Indok', required: true },
        { id: 'started_at', label: 'Kezdete', required: true },
        { id: 'ended_at', label: 'Vége', required: true },
        { id: 'status', label: 'Státusz', required: true },
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

            router.get(route('holiday.index'), queryParams, {
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

    const confirmDelete = () => {
        setDeleteState((prev) => ({ ...prev, is_processing: true }));

        const inertiaCallbacks = {
            preserveScroll: true,
            onSuccess: () => {
                setSelectedRows([]);
                setDeleteState({ is_open: false, is_bulk: false, ids: [], is_processing: false });
            },
            onError: () => {
                setDeleteState((prev) => ({ ...prev, is_processing: false }));
                toast.error('Hiba történt a visszavonás során.');
            },
        };

        if (delete_state.is_bulk) {
            router.delete(route('holiday.bulk.delete'), {
                data: { holiday_ids: delete_state.ids },
                ...inertiaCallbacks,
            });
        } else {
            router.delete(route('holiday.delete', delete_state.ids[0]), {
                ...inertiaCallbacks,
            });
        }
    };

    const table_columns = useMemo<ColumnDef<Holiday>[]>(() => {
        return column_definitions
            .filter((col) => visible_columns.includes(col.id))
            .map((col) => {
                let render_func;

                if (col.id === 'discord_id') {
                    render_func = (row: Holiday) => row.guild_user?.user_id || row.user_id || 'Ismeretlen';
                } else if (col.id === 'discord_name') {
                    render_func = (row: Holiday) => (
                        <div className="flex flex-col">
                            <span className="font-semibold text-foreground">
                                {row.guild_user?.ic_name || row.guild_user?.user?.name || 'Ismeretlen'}
                            </span>
                            {row.guild_user?.ic_name && (
                                <span className="text-xs text-muted-foreground">
                                    {row.guild_user?.user?.name || ''}
                                </span>
                            )}
                        </div>
                    );
                } else if (col.id === 'reason') {
                    render_func = (row: Holiday) => (
                        <div className="max-w-[300px] truncate" title={row.reason}>
                            {row.reason}
                        </div>
                    );
                } else if (col.id === 'started_at') {
                    render_func = (row: Holiday) => formatDate(row.started_at, '');
                } else if (col.id === 'ended_at') {
                    render_func = (row: Holiday) => formatDate(row.ended_at, '');
                } else if (col.id === 'status') {
                    render_func = (row: Holiday) => {
                        if (row.deleted_at) {
                            return <Badge variant="secondary" className="text-muted-foreground">Visszavonva</Badge>;
                        }
                        if (row.ended_at && new Date(row.ended_at) < new Date()) {
                            return <Badge variant="outline" className="border-muted-foreground/30 text-muted-foreground">Lejárt</Badge>;
                        }
                        if (row.started_at && new Date(row.started_at) > new Date()) {
                            return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-600 hover:bg-yellow-500/30">Hamarosan</Badge>;
                        }
                        return <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">Aktív</Badge>;
                    };
                }

                return {
                    id: col.id,
                    label: col.label,
                    sortable: true,
                    render: render_func,
                };
            });
    }, [column_definitions, visible_columns]);

    const renderActions = useCallback((row: Holiday) => {
        const isDeleted = !!row.deleted_at;

        return (
            <div className="flex justify-end gap-1">
                <TooltipProvider delayDuration={200}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:bg-destructive/10 disabled:opacity-30"
                                disabled={isDeleted}
                                onClick={() => setDeleteState({ is_open: true, is_bulk: false, ids: [row.id], is_processing: false })}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            {isDeleted ? 'Már visszavonva' : 'Visszavonás'}
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
        );
    }, []);

    return (
        <AppLayout>
            <Head title="Szabadságok" />
            <div className="container mx-auto space-y-6 px-4 py-8">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        Szabadságok
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">Tagok szabadságainak áttekintése és kezelése. Összesen: {holidays?.total || 0} bejegyzés.</p>
                </div>

                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mt-8">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4 flex-1">

                        {/* Tömeges műveletek */}
                        {selected_rows.length > 0 && (
                            <div className="flex shrink-0 items-center gap-2 bg-muted/50 p-1.5 rounded-md border">
                                <span className="text-sm font-medium px-2">{selected_rows.length} elem kijelölve</span>

                                <Button
                                    variant="destructive"
                                    size="sm"
                                    className="h-8"
                                    onClick={() => setDeleteState({ is_open: true, is_bulk: true, ids: selected_rows, is_processing: false })}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" /> Tömeges visszavonás
                                </Button>
                            </div>
                        )}

                        {/* Kereső / Toolbar */}
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
                    <DataTable<Holiday>
                        data={holidays?.data || []}
                        columns={table_columns}
                        key_field="id"
                        selected_rows={selected_rows}
                        onSelectionChange={setSelectedRows}
                        is_row_selectable={(row) => !row.deleted_at}
                        sort_column={sort_column}
                        sort_direction={sort_direction as 'asc' | 'desc'}
                        onSort={handleSort}
                        actions={renderActions}
                        empty_message="Nincs megjeleníthető szabadság."
                    />
                </div>

                {(holidays?.last_page || 1) > 1 && (
                    <div className="flex justify-center gap-2 pt-4">
                        {(holidays?.links || []).map((link, i) => (
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

            {/* Visszavonás Dialog */}
            <ConfirmDeleteDialog
                isOpen={delete_state.is_open}
                onClose={() => setDeleteState((prev) => ({ ...prev, is_open: false }))}
                onConfirm={confirmDelete}
                isProcessing={delete_state.is_processing}
                title="Visszavonás megerősítése"
                confirmText="Visszavonás"
                description={
                    delete_state.is_bulk
                        ? `Biztosan vissza szeretnéd vonni a kijelölt ${delete_state.ids.length} szabadságot? A művelet archiválja őket.`
                        : "Biztosan vissza szeretnéd vonni ezt a szabadságot? A művelet archiválja a tételt."
                }
            />
        </AppLayout>
    );
}
