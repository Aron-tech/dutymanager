import { Head, router, usePage } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import React, {
    useState,
    useMemo,
    useEffect,
    useCallback,
    useRef,
} from 'react';
import { toast } from 'sonner';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { DataTable } from '@/components/data-table';
import type { ColumnDef } from '@/components/data-table';
import { DataTableToolbar } from '@/components/data-table-toolbar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useDebounce } from '@/hooks/use-debounce';
import AppLayout from '@/layouts/app-layout';
import { formatDuty } from '@/lib/utils';
import EditDutyModal from '@/pages/guild-users/_edit-duty-modal';
import EditPunishmentModal from '@/pages/guild-users/_edit-punishment-modal';
import type { GuildUser, UserManagerProps } from '@/types';
import CreateEditUserModal from './_create-edit-modal';
import UserImageGallery from './_image-gallery-modal';
import PunishmentsCell from './_punishments-cell';
import UserTableActions from './_user-table-actions';

export default function UserManagerView({
    guild_users,
    user_details_config = [],
    unattached_guild_users = [],
    filters,
    has_rank_system = false,
    available_ranks = [],
}: UserManagerProps) {
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
        safe_filters.per_page || String(guild_users.per_page),
    );
    const [custom_per_page, setCustomPerPage] = useState('');
    const [selected_rows, setSelectedRows] = useState<(string | number)[]>([]);
    const [sort_column, setSortColumn] = useState(
        safe_filters.sort || 'created_at',
    );
    const [sort_direction, setSortDirection] = useState(
        safe_filters.direction || 'desc',
    );

    const [is_modal_open, setIsModalOpen] = useState(false);
    const [edit_user, setEditUser] = useState<GuildUser | null>(null);
    const [duty_user, setDutyUser] = useState<GuildUser | null>(null);
    const [punishment_user, setPunishmentUser] = useState<GuildUser | null>(null);
    const [gallery_user, setGalleryUser] = useState<GuildUser | null>(null);
    const [delete_state, setDeleteState] = useState<{
        is_open: boolean;
        ids: (string | number)[];
        is_processing: boolean;
    }>({
        is_open: false,
        ids: [],
        is_processing: false,
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const safe_user_details = Array.isArray(user_details_config)
        ? user_details_config
        : [];

    const column_definitions = useMemo(() => {
        const base_cols = [
            { id: 'user_id', label: 'Discord ID', required: true },
            { id: 'global_name', label: 'Discord Név', required: true },
            { id: 'ic_name', label: 'IC Név', required: true },
            { id: 'punishments', label: 'Büntetések', required: true },
        ];

        const config_cols = safe_user_details.map((config) => ({
            id: `detail_${config.name}`,
            label: config.name,
            required: config.required,
            is_dynamic: true,
        }));

        const duty_cols = [
            { id: 'current_duty', label: 'Aktuális Duty', required: true },
            { id: 'all_duty', label: 'Összes Duty', required: true },
            { id: 'joined_at', label: 'Csatlakozott', required: true },
        ];

        return [...base_cols, ...config_cols, ...duty_cols];
    }, [safe_user_details]);

    const default_visible = column_definitions
        .filter((col) => col.required)
        .map((col) => col.id);
    const [visible_columns, setVisibleColumns] =
        useState<string[]>(default_visible);

    const is_mounted = useRef(false);
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
        );
    }, [debounced_search]);

    const fetchFilteredData = useCallback(
        (search: string, limit: string, sort: string, dir: string) => {
            router.get(
                route('guild.users.index'),
                { search, per_page: limit, sort, direction: dir },
                { preserveState: true, preserveScroll: true, replace: true },
            );
        },
        [],
    );

    const handlePerPageChange = (val: string) => {
        if (val !== 'custom') {
            setPerPageAmount(val);
            setCustomPerPage('');
            fetchFilteredData(
                debounced_search,
                val,
                sort_column,
                sort_direction,
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
            );
        }
    };

    const handleSort = (col_id: string) => {
        const new_dir =
            sort_column === col_id && sort_direction === 'asc' ? 'desc' : 'asc';
        setSortColumn(col_id);
        setSortDirection(new_dir);
        fetchFilteredData(debounced_search, per_page_amount, col_id, new_dir);
    };

    const toggleColumnVisibility = (col_id: string) => {
        setVisibleColumns((prev) =>
            prev.includes(col_id)
                ? prev.filter((id) => id !== col_id)
                : [...prev, col_id],
        );
    };

    const confirmDelete = () => {
        if (delete_state.ids.length === 0) {
            return;
        }

        setDeleteState((prev) => ({ ...prev, is_processing: true }));

        const is_single = delete_state.ids.length === 1;
        const route_name = is_single
            ? 'guild.users.delete'
            : 'guild.users.bulk.delete';
        const payload = is_single ? {} : { data: { ids: delete_state.ids } };
        const url = is_single
            ? route(route_name, delete_state.ids[0])
            : route(route_name);

        router.delete(url, {
            ...payload,
            preserveScroll: true,
            onFinish: () => {
                setDeleteState({
                    is_open: false,
                    ids: [],
                    is_processing: false,
                });
                setSelectedRows([]);
            },
        });
    };

    const table_columns = useMemo<ColumnDef<GuildUser>[]>(() => {
        return column_definitions
            .filter((col) => visible_columns.includes(col.id))
            .map((col) => {
                let render_func;

                if (col.id === 'user_id') {
                    render_func = (row: GuildUser) => row.user_id;
                } else if (col.id === 'global_name') {
                    render_func = (row: GuildUser) => row.user?.name;
                } else if (col.id === 'ic_name') {
                    render_func = (row: GuildUser) => (
                        <span className="font-semibold">{row.ic_name}</span>
                    );
                } else if (col.id === 'punishments') {
                    render_func = (row: any) => (
                        <PunishmentsCell
                            punishments={
                                row.active_punishments ||
                                row.activePunishments ||
                                []
                            }
                        />
                    );
                } else if (col.id === 'current_duty') {
                    render_func = (row: GuildUser) => (
                        <Badge>
                            {formatDuty(row.current_period_duties_sum_value)}
                        </Badge>
                    );
                } else if (col.id === 'all_duty') {
                    render_func = (row: GuildUser) =>
                        formatDuty(row.all_period_duties_sum_value);
                } else if (col.id === 'joined_at') {
                    render_func = (row: GuildUser) => row.joined_ago;
                } else if (col.id.startsWith('detail_')) {
                    const key = col.id.replace('detail_', '');
                    render_func = (row: GuildUser) => row.details?.[key] || '-';
                }

                return {
                    id: col.id,
                    label: col.label,
                    sortable: true,
                    render: render_func,
                };
            });
    }, [column_definitions, visible_columns]);

    const renderActions = useCallback(
        (row: GuildUser) => (
            <UserTableActions
                user={row}
                onEdit={(u) => {
                    setEditUser(u);
                    setIsModalOpen(true);
                }}
                onShowDuties={(u) => setDutyUser(u)}
                onShowPunishments={(u) => setPunishmentUser(u)}
                onShowGallery={(u) => setGalleryUser(u)}
                onDelete={(u) =>
                    setDeleteState({
                        is_open: true,
                        ids: [u.id],
                        is_processing: false,
                    })
                }
            />
        ),
        [],
    );

    return (
        <AppLayout>
            <Head title="Felhasználó Kezelő" />
            <div className="container mx-auto space-y-6 px-4 py-8">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">
                        Felhasználó Kezelő
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Szerver tagok kezelése. Összesen: {guild_users.total}{' '}
                        tag.
                    </p>
                </div>

                <div className="grid grid-cols-6 items-center gap-4">
                    <div className="col-span-5 hidden sm:block">
                        <div className="h-px w-full bg-border/60" />
                    </div>
                    <div className="col-span-6 sm:col-span-1">
                        <Button
                            className="w-full shadow-sm"
                            variant="default"
                            onClick={() => {
                                setEditUser(null);
                                setIsModalOpen(true);
                            }}
                        >
                            <Plus className="mr-2 h-4 w-4" /> Új felhasználó
                        </Button>
                    </div>
                </div>

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

                {selected_rows.length > 0 && (
                    <div className="flex items-center justify-between rounded-lg border bg-muted/50 px-4 py-2">
                        <span className="text-sm font-medium">
                            {selected_rows.length} elem kijelölve
                        </span>
                        <div className="flex gap-2">
                            <Button variant="secondary" size="sm">
                                Tömeges szerkesztés
                            </Button>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() =>
                                    setDeleteState({
                                        is_open: true,
                                        ids: selected_rows,
                                        is_processing: false,
                                    })
                                }
                            >
                                Tömeges törlés
                            </Button>
                        </div>
                    </div>
                )}

                <DataTable<GuildUser>
                    data={guild_users.data}
                    columns={table_columns}
                    key_field="id"
                    selected_rows={selected_rows}
                    onSelectionChange={setSelectedRows}
                    sort_column={sort_column}
                    sort_direction={sort_direction}
                    onSort={handleSort}
                    actions={renderActions}
                    empty_message="Nincs megjeleníthető felhasználó."
                />

                {guild_users.last_page > 1 && (
                    <div className="flex justify-center gap-2 pt-4">
                        {guild_users.links.map((link, i) => (
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
                                        },
                                    )
                                }
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>

            <CreateEditUserModal
                is_open={is_modal_open}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditUser(null);
                }}
                edit_user={edit_user}
                user_details_config={safe_user_details}
                unattached_guild_users={unattached_guild_users}
                has_rank_system={has_rank_system}
                available_ranks={available_ranks}
            />

            <EditDutyModal
                is_open={!!duty_user}
                onClose={() => setDutyUser(null)}
                user={duty_user}
            />
            <EditPunishmentModal
                is_open={!!punishment_user}
                onClose={() => setPunishmentUser(null)}
                user={punishment_user}
            />
            <UserImageGallery
                user={gallery_user}
                onClose={() => setGalleryUser(null)}
            />

            <ConfirmDeleteDialog
                isOpen={delete_state.is_open}
                onClose={() => setDeleteState((prev) => ({ ...prev, is_open: false }))}
                onConfirm={confirmDelete}
                isProcessing={delete_state.is_processing}
                description={
                    <>
                        Biztosan törölni szeretnéd{' '}
                        {delete_state.ids.length === 1
                            ? 'ezt a felhasználót'
                            : `ezt a(z) ${delete_state.ids.length} felhasználót`}
                        ? Ez a művelet végleges, és minden kapcsolódó adat elvész.
                    </>
                }
            />
        </AppLayout>
    );
}
