import { Head, router, usePage } from '@inertiajs/react';
import {
    Search,
    SlidersHorizontal,
    MoreVertical,
    Edit,
    Trash2,
    Plus,
    ImageIcon,
    Clock,
} from 'lucide-react';
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { DataTable } from '@/components/data-table';
import type { ColumnDef } from '@/components/data-table';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogMedia,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { formatDuty } from '@/lib/utils';
import EditDutyModal from '@/pages/guild-users/_edit-duty-modal';
import type {
    GuildUser,
    PaginatedData,
    Rank,
    UserDetailsConfig,
    SelectItem as DiscordSelectItem,
} from '@/types';
import CreateEditUserModal from './_create-edit-modal';
import UserImageGallery from './_image-gallery-modal';
import PunishmentsCell from './_punishments-cell';

interface UserManagerProps {
    guild_users: PaginatedData<GuildUser>;
    user_details_config: UserDetailsConfig[];
    unattached_guild_users: DiscordSelectItem[];
    filters: {
        search?: string;
        per_page?: string;
        sort?: string;
        direction?: string;
    };
    has_rank_system?: boolean;
    available_ranks?: Rank[];
}

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
    const search_timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [search_query, setSearchQuery] = useState(safe_filters.search || '');
    const [per_page_amount, setPerPageAmount] = useState(
        safe_filters.per_page || String(guild_users.per_page),
    );
    const [custom_per_page, setCustomPerPage] = useState('');
    const [selected_rows, setSelectedRows] = useState<(string | number)[]>([]);
    const [is_modal_open, setIsModalOpen] = useState(false);

    const [edit_user, setEditUser] = useState<GuildUser | null>(null);
    const [duty_user, setDutyUser] = useState<GuildUser | null>(null);
    const [gallery_user, setGalleryUser] = useState<GuildUser | null>(null);

    const [sort_column, setSortColumn] = useState(
        safe_filters.sort || 'created_at',
    );
    const [sort_direction, setSortDirection] = useState(
        safe_filters.direction || 'desc',
    );

    const [delete_state, setDeleteState] = useState<{
        is_open: boolean;
        ids: (string | number)[];
        is_processing: boolean;
    }>({
        is_open: false,
        ids: [],
        is_processing: false,
    });

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

    const fetchFilteredData = (
        search: string,
        limit: string,
        sort: string,
        dir: string,
    ) => {
        router.get(
            route('guild.users.index'),
            { search, per_page: limit, sort, direction: dir },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setSearchQuery(val);

        if (search_timeout.current) {
            clearTimeout(search_timeout.current);
        }

        search_timeout.current = setTimeout(() => {
            fetchFilteredData(
                val,
                per_page_amount,
                sort_column,
                sort_direction,
            );
        }, 400);
    };

    const handlePerPageChange = (val: string) => {
        if (val !== 'custom') {
            setPerPageAmount(val);
            setCustomPerPage('');
            fetchFilteredData(search_query, val, sort_column, sort_direction);
        } else {
            setPerPageAmount('custom');
        }
    };

    const handleCustomPerPageSubmit = (
        e: React.KeyboardEvent<HTMLInputElement>,
    ) => {
        if (e.key === 'Enter' && custom_per_page) {
            fetchFilteredData(
                search_query,
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
        fetchFilteredData(search_query, per_page_amount, col_id, new_dir);
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
                        <PunishmentsCell punishments={row.active_punishments} />
                    );
                } else if (col.id === 'current_duty') {
                    render_func = (row: GuildUser) => (
                        <Badge>
                            {formatDuty(
                                row.current_period_duties_sum_value,
                            )}
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

    const renderActions = (row: GuildUser) => (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem
                    onClick={() => {
                        setEditUser(row);
                        setIsModalOpen(true);
                    }}
                >
                    <Edit className="mr-2 h-4 w-4" /> Szerkesztés
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => setDutyUser(row)}>
                    <Clock className="mr-2 h-4 w-4" /> Szolgálati idő
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => setGalleryUser(row)}>
                    <ImageIcon className="mr-2 h-4 w-4" /> Képek
                    {(row as any).images?.length > 0 && (
                        <Badge className="ml-auto flex h-5 w-5 items-center justify-center rounded-full p-0">
                            {(row as any).images.length}
                        </Badge>
                    )}
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() =>
                        setDeleteState({
                            is_open: true,
                            ids: [row.id],
                            is_processing: false,
                        })
                    }
                >
                    <Trash2 className="mr-2 h-4 w-4" /> Törlés
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
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
                </div>

                <div className="flex flex-wrap items-center justify-end gap-3">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Keresés IC név alapján..."
                            className="pl-9"
                            value={search_query}
                            onChange={handleSearchChange}
                        />
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                className="flex items-center gap-2"
                            >
                                <SlidersHorizontal className="h-4 w-4" />{' '}
                                Oszlopok
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>
                                Látható oszlopok
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {column_definitions.map((col) => (
                                <DropdownMenuCheckboxItem
                                    key={col.id}
                                    checked={visible_columns.includes(col.id)}
                                    onCheckedChange={() =>
                                        toggleColumnVisibility(col.id)
                                    }
                                    disabled={col.id === 'ic_name'}
                                >
                                    {col.label}{' '}
                                    {col?.is_dynamic &&
                                        !col.required &&
                                        '(Opcionális)'}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <div className="flex items-center gap-2">
                        <Select
                            value={per_page_amount}
                            onValueChange={handlePerPageChange}
                        >
                            <SelectTrigger className="w-[100px]">
                                <SelectValue placeholder="Sor/oldal" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="20">20</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                                <SelectItem value="custom">Egyedi</SelectItem>
                            </SelectContent>
                        </Select>
                        {per_page_amount === 'custom' && (
                            <Input
                                type="number"
                                placeholder="db"
                                className="w-16"
                                value={custom_per_page}
                                onChange={(e) =>
                                    setCustomPerPage(e.target.value)
                                }
                                onKeyDown={handleCustomPerPageSubmit}
                            />
                        )}
                    </div>
                </div>

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
                                        {
                                            search: search_query,
                                            per_page: per_page_amount,
                                            sort: sort_column,
                                            direction: sort_direction,
                                        },
                                        { preserveScroll: true },
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

            <UserImageGallery
                user={gallery_user}
                onClose={() => setGalleryUser(null)}
            />

            <AlertDialog
                open={delete_state.is_open}
                onOpenChange={(open) =>
                    !open &&
                    !delete_state.is_processing &&
                    setDeleteState((prev) => ({
                        ...prev,
                        is_open: false,
                    }))
                }
            >
                <AlertDialogContent size="sm">
                    <AlertDialogHeader>
                        <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive">
                            <Trash2 className="h-6 w-6" />
                        </AlertDialogMedia>
                        <AlertDialogTitle>Törlés megerősítése</AlertDialogTitle>
                        <AlertDialogDescription>
                            Biztosan törölni szeretnéd{' '}
                            {delete_state.ids.length === 1
                                ? 'ezt a felhasználót'
                                : `ezt a(z) ${delete_state.ids.length} felhasználót`}
                            ? Ez a művelet végleges, és minden kapcsolódó adat
                            elvész.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel
                            variant="outline"
                            disabled={delete_state.is_processing}
                        >
                            Mégse
                        </AlertDialogCancel>
                        <AlertDialogAction
                            variant="destructive"
                            onClick={(e) => {
                                e.preventDefault();
                                confirmDelete();
                            }}
                            disabled={delete_state.is_processing}
                        >
                            {delete_state.is_processing
                                ? 'Törlés folyamatban...'
                                : 'Törlés'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
