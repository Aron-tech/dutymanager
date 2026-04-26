import { Head, router, usePage } from '@inertiajs/react';
import { ArrowRightLeft, Plus, Trash2, FolderInput } from 'lucide-react';
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { DataTable } from '@/components/data-table';
import type { ColumnDef } from '@/components/data-table';
import { DataTableToolbar } from '@/components/data-table-toolbar';
import SearchableSingleSelect from '@/components/searchable-single-select';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useDebounce } from '@/hooks/use-debounce';
import AppLayout from '@/layouts/app-layout';
import { formatDuty, formatDate } from '@/lib/utils';
import EditDutyModal from '@/pages/guild-users/_edit-duty-modal';
import type { Duty, GuildUser } from '@/types';

const defaultDuties = {
    data: [],
    links: [],
    total: 0,
    per_page: 15,
    last_page: 1,
};

interface PageProps {
    duties?: {
        data: Duty[];
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
        status?: string;
    };
    guild_users?: { id: number; label: string; full_user: GuildUser }[];
}

export default function DutiesIndexView({
                                            duties = defaultDuties,
                                            filters = {},
                                            guild_users = []
                                        }: PageProps) {
    const { props } = usePage();
    const flash = props.flash as { success: string | null; error: string | null; };

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
        safe_filters.per_page || String(duties?.per_page || 15)
    );
    const [custom_per_page, setCustomPerPage] = useState('');
    const [status_filter, setStatusFilter] = useState(safe_filters.status || 'all');
    const [sort_column, setSortColumn] = useState(safe_filters.sort || 'started_at');
    const [sort_direction, setSortDirection] = useState(safe_filters.direction || 'desc');

    const [selected_rows, setSelectedRows] = useState<(string | number)[]>([]);

    const [selected_guild_user_id, setSelectedGuildUserId] = useState<string>('');
    const [modal_user, setModalUser] = useState<GuildUser | null>(null);

    const [delete_state, setDeleteState] = useState<{
        is_open: boolean;
        is_bulk: boolean;
        ids: (string | number)[];
        is_processing: boolean;
    }>({ is_open: false, is_bulk: false, ids: [], is_processing: false });

    const column_definitions = useMemo(() => [
        { id: 'discord_id', label: 'Discord ID', required: true },
        { id: 'discord_name', label: 'Discord Név', required: true },
        { id: 'value', label: 'Mentett idő', required: true },
        { id: 'started_at', label: 'Szolgálatba lépés', required: true },
        { id: 'finished_at', label: 'Szolgálatból kilépés', required: true },
        { id: 'status', label: 'Státusz', required: true },
    ], []);

    const [visible_columns, setVisibleColumns] = useState<string[]>(
        column_definitions.map((c) => c.id)
    );

    const is_mounted = useRef(false);

    const fetchFilteredData = useCallback(
        (search: string, limit: string, sort: string, dir: string, status: string) => {
            const queryParams: any = {
                per_page: limit,
                sort,
                direction: dir,
                status
            };

            if (search) {
                queryParams.search = search;
            }

            router.get(route('duty.index'), queryParams, {
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

        fetchFilteredData(debounced_search, per_page_amount, sort_column, sort_direction, status_filter);
    }, [debounced_search, status_filter]);

    const handlePerPageChange = (val: string) => {
        if (val !== 'custom') {
            setPerPageAmount(val);
            setCustomPerPage('');
            fetchFilteredData(debounced_search, val, sort_column, sort_direction, status_filter);
        } else {
            setPerPageAmount('custom');
        }
    };

    const handleCustomPerPageSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && custom_per_page) {
            fetchFilteredData(debounced_search, custom_per_page, sort_column, sort_direction, status_filter);
        }
    };

    const handleSort = (col_id: string) => {
        const new_dir = sort_column === col_id && sort_direction === 'asc' ? 'desc' : 'asc';
        setSortColumn(col_id);
        setSortDirection(new_dir);
        fetchFilteredData(debounced_search, per_page_amount, col_id, new_dir, status_filter);
    };

    const toggleColumnVisibility = (col_id: string) => {
        setVisibleColumns((prev) =>
            prev.includes(col_id) ? prev.filter((id) => id !== col_id) : [...prev, col_id]
        );
    };

    const handleUpdateStatus = (duty_ids: (string | number)[], targetStatus: number) => {
        const numericIds = duty_ids.map(id => Number(id));
        router.put(
            route('duty.update.status'),
            { duty_ids: numericIds, status: targetStatus },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSelectedRows([]);
                },
                onError: () => toast.error('Hiba a státusz frissítésekor.'),
            }
        );
    };

    const confirmDelete = () => {
        setDeleteState((prev) => ({ ...prev, is_processing: true }));

        if (delete_state.is_bulk) {
            router.delete(route('duty.bulk.delete'), {
                data: { duty_ids: delete_state.ids },
                preserveScroll: true,
                onSuccess: () => {
                    setSelectedRows([]);
                    setDeleteState({ is_open: false, is_bulk: false, ids: [], is_processing: false });
                },
                onError: () => {
                    setDeleteState((prev) => ({ ...prev, is_processing: false }));
                    toast.error('Hiba történt a törlés során.');
                },
            });
        } else {
            router.delete(route('duty.delete', delete_state.ids[0]), {
                preserveScroll: true,
                onSuccess: () => {
                    setDeleteState({ is_open: false, is_bulk: false, ids: [], is_processing: false });
                },
                onError: () => {
                    setDeleteState((prev) => ({ ...prev, is_processing: false }));
                    toast.error('Hiba történt a törlés során.');
                },
            });
        }
    };

    const table_columns = useMemo<ColumnDef<Duty>[]>(() => {
        return column_definitions
            .filter((col) => visible_columns.includes(col.id))
            .map((col) => {
                let render_func;

                if (col.id === 'discord_id') {
                    render_func = (row: Duty) => row.guild_user?.user_id || 'Ismeretlen';
                } else if (col.id === 'discord_name') {
                    render_func = (row: Duty) => (
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
                } else if (col.id === 'value') {
                    render_func = (row: Duty) => <span className="font-mono font-medium">{formatDuty(row.value || 0)}</span>;
                } else if (col.id === 'started_at') {
                    render_func = (row: Duty) => formatDate(row.started_at, '');
                } else if (col.id === 'finished_at') {
                    render_func = (row: Duty) => formatDate(row.finished_at, 'Folyamatban');
                } else if (col.id === 'status') {
                    render_func = (row: Duty) => (
                        String(row.status) === '0'
                            ? <Badge variant="default" className="bg-green-500 hover:bg-green-600">Aktuális</Badge>
                            : <Badge variant="secondary">Archív</Badge>
                    );
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
        const currentStatus = String(row.status);
        const targetStatus = currentStatus === '0' ? 1 : 0;
        const tooltipTitle = currentStatus === '0' ? 'Áthelyezés Archívba' : 'Áthelyezés Aktuálisba';

        return (
            <div className="flex justify-end gap-1">
                <TooltipProvider delayDuration={200}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleUpdateStatus([row.id], targetStatus)}
                            >
                                <ArrowRightLeft className="h-4 w-4 text-muted-foreground transition-colors hover:text-primary" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>{tooltipTitle}</TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => setDeleteState({ is_open: true, is_bulk: false, ids: [row.id], is_processing: false })}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Törlés</TooltipContent>
                </Tooltip>
            </div>
        );
    }, []);

    const handleUserSelect = (val: string) => {
        setSelectedGuildUserId(val);
        const selected = (guild_users || []).find((gu) => String(gu.id) === val);

        if (selected) {
            setModalUser(selected.full_user);
        }
    };

    const searchable_users = guild_users.map(gu => ({
        label: gu.label,
        value: String(gu.id),
    }));

    return (
        <AppLayout>
            <Head title="Szolgálatok Kezelése" />
            <div className="container mx-auto space-y-6 px-4 py-8">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">Összes Szolgálati Idő</h2>
                    <p className="text-sm text-muted-foreground">Mentett Duty logok kezelése. Összesen: {duties?.total || 0} bejegyzés.</p>
                </div>

                <Accordion type="single" collapsible className="w-full rounded-lg border bg-muted/10 shadow-sm px-4">
                    <AccordionItem value="new-duty" className="border-b-0">
                        <AccordionTrigger className="text-sm font-semibold hover:no-underline flex gap-2">
                            <div className="flex items-center gap-2">
                                <Plus className="h-4 w-4 text-primary" />
                                Szolgálati idő hozzáadása
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-2 pb-4">
                            <div className="max-w-md space-y-3">
                                <label className="text-sm font-medium text-foreground">Válassz felhasználót</label>
                                <SearchableSingleSelect
                                    items={searchable_users}
                                    value={selected_guild_user_id}
                                    onChange={handleUserSelect}
                                    placeholder="Felhasználó keresése..."
                                    renderItem={(item) => <span>{item.label}</span>}
                                />
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>

                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mt-8">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4 flex-1">
                        {/* Tömeges műveletek megjelenítése a kereső ELŐTT */}
                        {selected_rows.length > 0 && (
                            <div className="flex shrink-0 items-center gap-2 bg-muted/50 p-1.5 rounded-md border">
                                <span className="text-sm font-medium px-2">{selected_rows.length} elem kijelölve</span>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm" className="shadow-sm h-8 bg-background">
                                            <FolderInput className="mr-2 h-4 w-4" /> Státusz váltás
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleUpdateStatus(selected_rows, 0)}>
                                            Áthelyezés aktuális időszakba
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleUpdateStatus(selected_rows, 1)}>
                                            Áthelyezés archívba
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                <Button
                                    variant="destructive"
                                    size="sm"
                                    className="h-8"
                                    onClick={() => setDeleteState({ is_open: true, is_bulk: true, ids: selected_rows, is_processing: false })}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" /> Tömeges törlés
                                </Button>
                            </div>
                        )}

                        {/* Kereső / Toolbar - Kijavítva, hogy kitöltse a helyet és ne törjön 2 sorba */}
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

                    {/* Státusz szűrők */}
                    <div className="flex shrink-0 items-center gap-2 bg-muted/30 p-1 rounded-lg border w-fit">
                        <Button
                            variant={status_filter === 'all' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setStatusFilter('all')}
                            className="h-8 text-xs font-medium"
                        >
                            Összes
                        </Button>
                        <Button
                            variant={status_filter === '0' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setStatusFilter('0')}
                            className="h-8 text-xs font-medium"
                        >
                            Aktuális
                        </Button>
                        <Button
                            variant={status_filter === '1' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setStatusFilter('1')}
                            className="h-8 text-xs font-medium"
                        >
                            Archív
                        </Button>
                    </div>
                </div>

                <div className="rounded-md border bg-background shadow-sm">
                    <DataTable<Duty>
                        data={duties?.data || []}
                        columns={table_columns}
                        key_field="id"
                        selected_rows={selected_rows}
                        onSelectionChange={setSelectedRows}
                        sort_column={sort_column}
                        sort_direction={sort_direction as 'asc' | 'desc'}
                        onSort={handleSort}
                        actions={renderActions}
                        empty_message="Nincs megjeleníthető szolgálati bejegyzés."
                    />
                </div>

                {(duties?.last_page || 1) > 1 && (
                    <div className="flex justify-center gap-2 pt-4">
                        {(duties?.links || []).map((link, i) => (
                            <Button
                                key={i}
                                variant={link.active ? 'default' : 'outline'}
                                size="sm"
                                disabled={!link.url}
                                onClick={() =>
                                    link.url &&
                                    router.get(
                                        link.url,
                                        {}, // Üres objektum, mivel a link.url már tartalmazza a page és per_page adatokat!
                                        {
                                            preserveState: true, // Ez akadályozza meg a komponens és a táblázat villogását/újratöltődését
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

            <EditDutyModal
                is_open={!!modal_user}
                onClose={() => {
                    setModalUser(null);
                    setSelectedGuildUserId('');
                }}
                user={modal_user}
            />

            <ConfirmDeleteDialog
                isOpen={delete_state.is_open}
                onClose={() => setDeleteState((prev) => ({ ...prev, is_open: false }))}
                onConfirm={confirmDelete}
                isProcessing={delete_state.is_processing}
                description={
                    delete_state.is_bulk
                        ? `Biztosan törölni szeretnéd a kijelölt ${delete_state.ids.length} bejegyzést?`
                        : "Biztosan törölni szeretnéd ezt a bejegyzést?"
                }
            />
        </AppLayout>
    );
}
