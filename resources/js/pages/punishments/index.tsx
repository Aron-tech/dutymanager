import { Head, router, usePage } from '@inertiajs/react';
import { Plus, ShieldAlert, Trash2 } from 'lucide-react';
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
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useDebounce } from '@/hooks/use-debounce';
import AppLayout from '@/layouts/app-layout';
import { formatDate } from '@/lib/utils';
import EditPunishmentModal from '@/pages/guild-users/_edit-punishment-modal';
import type { Punishment, GuildUser } from '@/types';

const defaultPunishments = {
    data: [],
    links: [],
    total: 0,
    per_page: 15,
    last_page: 1,
};

interface PageProps {
    punishments?: {
        data: Punishment[];
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
    guild_users?: { id: number; label: string; full_user: GuildUser }[];
    available_types?: Record<string, string>;
}

export default function PunishmentsIndexView({
                                                 punishments = defaultPunishments,
                                                 filters = {},
                                                 guild_users = [],
                                                 available_types = {},
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
        safe_filters.per_page || String(punishments?.per_page || 15)
    );
    const [custom_per_page, setCustomPerPage] = useState('');
    const [sort_column, setSortColumn] = useState(safe_filters.sort || 'created_at');
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
        { id: 'type', label: 'Típus', required: true },
        { id: 'level', label: 'Szint', required: true },
        { id: 'reason', label: 'Indok', required: true },
        { id: 'created_by', label: 'Kiosztó', required: true },
        { id: 'created_at', label: 'Kiosztva', required: true },
        { id: 'expires_at', label: 'Lejárat', required: true },
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

            // Megjegyzés: Győződj meg róla, hogy a 'punishment.index' létezik a web.php-ben
            router.get(route('punishment.index'), queryParams, {
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
            router.delete(route('punishment.bulk.delete'), {
                data: { punishment_ids: delete_state.ids },
                ...inertiaCallbacks,
            });
        } else {
            router.delete(route('punishment.delete', delete_state.ids[0]), {
                ...inertiaCallbacks,
            });
        }
    };

    const table_columns = useMemo<ColumnDef<Punishment>[]>(() => {
        return column_definitions
            .filter((col) => visible_columns.includes(col.id))
            .map((col) => {
                let render_func;

                if (col.id === 'discord_id') {
                    render_func = (row: Punishment) => row.guild_user?.user_id || 'Ismeretlen';
                } else if (col.id === 'discord_name') {
                    render_func = (row: Punishment) => (
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
                } else if (col.id === 'type') {
                    render_func = (row: Punishment) => (
                        <span className="font-medium">
                            {available_types[row.type] || row.type}
                        </span>
                    );
                } else if (col.id === 'level') {
                    render_func = (row: Punishment) => row.level || '-';
                } else if (col.id === 'reason') {
                    render_func = (row: Punishment) => (
                        <div className="max-w-[200px] truncate" title={row.reason}>
                            {row.reason}
                        </div>
                    );
                } else if (col.id === 'created_by') {
                    render_func = (row: Punishment) => row.created_by_user?.name || 'Ismeretlen';
                } else if (col.id === 'created_at') {
                    render_func = (row: Punishment) => formatDate(row.created_at, '');
                } else if (col.id === 'expires_at') {
                    render_func = (row: Punishment) => (
                        <span className={!row.expires_at ? 'font-semibold text-destructive' : ''}>
                            {formatDate(row.expires_at, 'Végleges')}
                        </span>
                    );
                } else if (col.id === 'status') {
                    render_func = (row: Punishment) => {
                        if (row.deleted_at) {
                            return <Badge variant="secondary" className="text-muted-foreground">Visszavonva</Badge>;
                        }
                        if (row.expires_at && new Date(row.expires_at) < new Date()) {
                            return <Badge variant="outline" className="border-muted-foreground/30 text-muted-foreground">Lejárt</Badge>;
                        }
                        return <Badge variant="default" className="bg-destructive hover:bg-destructive/90">Aktív</Badge>;
                    };
                }

                return {
                    id: col.id,
                    label: col.label,
                    sortable: true,
                    render: render_func,
                };
            });
    }, [column_definitions, visible_columns, available_types]);

    const renderActions = useCallback((row: Punishment) => {
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
            <Head title="Büntetések Kezelése" />
            <div className="container mx-auto space-y-6 px-4 py-8">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        Összes Büntetés
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">Szerveren lévő büntetések kezelése és visszavonása. Összesen: {punishments?.total || 0} bejegyzés.</p>
                </div>

                <Accordion type="single" collapsible className="w-full rounded-lg border bg-muted/10 shadow-sm px-4">
                    <AccordionItem value="new-punishment" className="border-b-0">
                        <AccordionTrigger className="text-sm font-semibold hover:no-underline flex gap-2">
                            <div className="flex items-center gap-2">
                                <Plus className="h-4 w-4 text-primary" />
                                Új büntetés kiosztása
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
                    <DataTable<Punishment>
                        data={punishments?.data || []}
                        columns={table_columns}
                        key_field="id"
                        selected_rows={selected_rows}
                        onSelectionChange={setSelectedRows}
                        // Csak akkor engedjük a kijelölést a tömeges törléshez, ha nincs még törölve
                        is_row_selectable={(row) => !row.deleted_at}
                        sort_column={sort_column}
                        sort_direction={sort_direction as 'asc' | 'desc'}
                        onSort={handleSort}
                        actions={renderActions}
                        empty_message="Nincs megjeleníthető büntetés."
                    />
                </div>

                {(punishments?.last_page || 1) > 1 && (
                    <div className="flex justify-center gap-2 pt-4">
                        {(punishments?.links || []).map((link, i) => (
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

            {/* Szintezés modal (Módosítás / Hozzáadás) */}
            <EditPunishmentModal
                is_open={!!modal_user}
                onClose={() => {
                    setModalUser(null);
                    setSelectedGuildUserId('');
                }}
                user={modal_user}
            />

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
                        ? `Biztosan vissza szeretnéd vonni a kijelölt ${delete_state.ids.length} büntetést? A művelet archiválja őket.`
                        : "Biztosan vissza szeretnéd vonni ezt a büntetést? A művelet archiválja a tételt."
                }
            />
        </AppLayout>
    );
}
