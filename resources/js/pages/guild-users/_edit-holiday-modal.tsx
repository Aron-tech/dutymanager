import { router } from '@inertiajs/react';
import { format } from 'date-fns';
import { hu } from 'date-fns/locale';
import { Trash2 } from 'lucide-react';
import React, { useEffect, useState, useMemo } from 'react';
import { toast } from 'sonner';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { DataTable } from '@/components/data-table';
import type { ColumnDef } from '@/components/data-table';
import { DataTablePagination } from '@/components/data-table-pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { useClientPagination } from '@/hooks/use-client-pagination';
import type { GuildUser } from '@/types';

interface EditHolidayModalProps {
    is_open: boolean;
    onClose: () => void;
    user: GuildUser | null;
}

export default function EditHolidayModal({ is_open, onClose, user }: EditHolidayModalProps) {
    const [holidays, setHolidays] = useState<any[]>([]);
    const [is_loading, setIsLoading] = useState(false);

    const [search_query, setSearchQuery] = useState('');
    const [sort_column, setSortColumn] = useState('started_at');
    const [sort_direction, setSortDirection] = useState<'desc' | 'asc'>('desc');

    const [delete_state, setDeleteState] = useState<{
        is_open: boolean;
        id: number | null;
        is_processing: boolean;
    }>({ is_open: false, id: null, is_processing: false });

    useEffect(() => {
        if (is_open && user) {
            setIsLoading(true);
            setSearchQuery('');
            setSortColumn('started_at');
            setSortDirection('desc');
            fetch(route('guild.users.holidays', { guild_user: user.id }))
                .then((res) => {
                    if (!res.ok) throw new Error('Hálózati hiba');
                    return res.json();
                })
                .then((data) => {
                    setHolidays(data);
                })
                .catch(() => {
                    toast.error('Nem sikerült betölteni a szabadságokat.');
                })
                .finally(() => {
                    setIsLoading(false);
                });
        } else {
            setHolidays([]);
        }
    }, [is_open, user]);

    const confirmDelete = () => {
        if (!delete_state.id) return;

        setDeleteState((prev) => ({ ...prev, is_processing: true }));

        router.delete(route('holiday.delete', delete_state.id), {
            preserveScroll: true,
            onSuccess: () => {
                setHolidays((prev) =>
                    prev.map((h) => (h.id === delete_state.id ? { ...h, deleted_at: new Date().toISOString() } : h))
                );
                setDeleteState({ is_open: false, id: null, is_processing: false });
                toast.success('Szabadság sikeresen visszavonva.');
            },
            onError: () => {
                setDeleteState((prev) => ({ ...prev, is_processing: false }));
                toast.error('Hiba történt a visszavonás során.');
            },
        });
    };

    const processed_holidays = useMemo(() => {
        let result = [...holidays];

        if (search_query) {
            const lower_query = search_query.toLowerCase();
            result = result.filter((h) => h.reason && h.reason.toLowerCase().includes(lower_query));
        }

        if (sort_column) {
            result.sort((a, b) => {
                let a_val = a[sort_column];
                let b_val = b[sort_column];

                if (sort_column === 'status') {
                    const getStatusSortValue = (h: any) => {
                        if (h.deleted_at) return 4;
                        if (h.ended_at && new Date(h.ended_at) < new Date()) return 3;
                        if (h.started_at && new Date(h.started_at) > new Date()) return 2;
                        return 1;
                    };
                    a_val = getStatusSortValue(a);
                    b_val = getStatusSortValue(b);
                }

                if (a_val < b_val) return sort_direction === 'asc' ? -1 : 1;
                if (a_val > b_val) return sort_direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return result;
    }, [holidays, search_query, sort_column, sort_direction]);

    const {
        currentData: current_data,
        currentPage: current_page,
        totalPages: total_pages,
        setPage: setPage,
    } = useClientPagination(processed_holidays, 5);

    useEffect(() => {
        setPage(1);
    }, [search_query, sort_column, sort_direction, setPage]);

    const holiday_columns: ColumnDef<any>[] = [
        {
            id: 'reason',
            label: 'Indok',
            sortable: true,
            render: (row) => (
                <div className="max-w-[150px] truncate" title={row.reason}>
                    {row.reason}
                </div>
            ),
        },
        {
            id: 'started_at',
            label: 'Kezdete',
            sortable: true,
            render: (row) => format(new Date(row.started_at), 'yyyy. MM. dd. HH:mm', { locale: hu }),
        },
        {
            id: 'ended_at',
            label: 'Vége',
            sortable: true,
            render: (row) => format(new Date(row.ended_at), 'yyyy. MM. dd. HH:mm', { locale: hu }),
        },
        {
            id: 'status',
            label: 'Státusz',
            sortable: true,
            render: (row) => {
                const is_deleted = !!row.deleted_at;
                if (is_deleted) return <Badge variant="secondary">Visszavonva</Badge>;
                if (row.ended_at && new Date(row.ended_at) < new Date()) return <Badge variant="outline">Lejárt</Badge>;
                if (row.started_at && new Date(row.started_at) > new Date()) return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-600">Hamarosan</Badge>;
                return <Badge className="bg-blue-500 hover:bg-blue-600">Aktív</Badge>;
            },
        },
    ];

    return (
        <>
            <Dialog open={is_open} onOpenChange={(open) => !open && onClose()}>
                <DialogContent className="sm:max-w-[750px] max-h-[90vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <span>Szabadság előzmények</span>
                            <Badge variant="secondary">{user?.ic_name}</Badge>
                        </DialogTitle>
                    </DialogHeader>

                    <ScrollArea className="flex-1 -mx-6 px-6">
                        {is_loading ? (
                            <div className="space-y-3 mt-4">
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-12 w-full" />
                                <Skeleton className="h-12 w-full" />
                            </div>
                        ) : (
                            <div className="space-y-4 mt-4">
                                <Input
                                    placeholder="Keresés indok alapján..."
                                    value={search_query}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="max-w-xs"
                                />

                                <div className="rounded-md border bg-background">
                                    <DataTable<any>
                                        data={current_data}
                                        columns={holiday_columns}
                                        key_field="id"
                                        selected_rows={[]}
                                        onSelectionChange={() => {}}
                                        is_row_selectable={() => false}
                                        sort_column={sort_column}
                                        sort_direction={sort_direction}
                                        onSort={(col_id) => {
                                            setSortDirection(
                                                sort_column === col_id && sort_direction === 'asc'
                                                    ? 'desc'
                                                    : 'asc'
                                            );
                                            setSortColumn(col_id);
                                        }}
                                        actions={(row) => {
                                            const is_deleted = !!row.deleted_at;
                                            return (
                                                <div className="flex justify-end gap-2">
                                                    <TooltipProvider delayDuration={200}>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-destructive hover:bg-destructive/10 disabled:opacity-30"
                                                                    disabled={is_deleted}
                                                                    onClick={() => setDeleteState({ is_open: true, id: row.id, is_processing: false })}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                {is_deleted ? 'Már visszavonva' : 'Visszavonás'}
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </div>
                                            );
                                        }}
                                        empty_message="Nincsenek rögzített szabadságok a megadott feltételekkel."
                                    />
                                    <DataTablePagination
                                        currentPage={current_page}
                                        totalPages={total_pages}
                                        onPageChange={setPage}
                                    />
                                </div>
                            </div>
                        )}
                    </ScrollArea>
                </DialogContent>
            </Dialog>

            <ConfirmDeleteDialog
                isOpen={delete_state.is_open}
                onClose={() => setDeleteState((prev) => ({ ...prev, is_open: false }))}
                onConfirm={confirmDelete}
                isProcessing={delete_state.is_processing}
                title="Visszavonás megerősítése"
                confirmText="Visszavonás"
                description="Biztosan vissza szeretnéd vonni ezt a szabadságot? Ez a művelet rögzítésre kerül az aktivitás naplóban."
            />
        </>
    );
}
