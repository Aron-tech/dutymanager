import { useForm, router } from '@inertiajs/react';
import axios from 'axios';
import {
    Clock,
    Trash2,
    Edit,
    Loader2,
    ArrowRightLeft,
    FolderInput,
} from 'lucide-react';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { DataTable } from '@/components/data-table';
import type { ColumnDef } from '@/components/data-table';
import { DataTablePagination } from '@/components/data-table-pagination';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useClientPagination } from '@/hooks/use-client-pagination';
import { formatDuty } from '@/lib/utils';
import type { GuildUser, Duty } from '@/types';

interface EditDutyModalProps {
    is_open: boolean;
    onClose: () => void;
    user: GuildUser | null;
}

export default function EditDutyModal({
    is_open,
    onClose,
    user,
}: EditDutyModalProps) {
    const [period_filter, setPeriodFilter] = useState<'current' | 'all'>(
        'current',
    );
    const [duties, setDuties] = useState<Duty[]>([]);
    const [total_current, setTotalCurrent] = useState<number>(0);
    const [total_all, setTotalAll] = useState<number>(0);
    const [is_loading, setIsLoading] = useState(false);

    const [selected_rows, setSelectedRows] = useState<(string | number)[]>([]);
    const [sort_column, setSortColumn] = useState('started_at');
    const [sort_direction, setSortDirection] = useState<'desc' | 'asc'>('desc');

    const [delete_state, setDeleteState] = useState<{
        is_open: boolean;
        is_bulk: boolean;
        duty_id: number | null;
        is_processing: boolean;
    }>({ is_open: false, is_bulk: false, duty_id: null, is_processing: false });

    const {
        data: manual_data,
        setData: setManualData,
        reset: resetManual,
        processing: is_processing,
    } = useForm({
        current_adj: '' as string | number,
        all_adj: '' as string | number,
    });

    const fetchDuties = useCallback(async () => {
        if (!user) {
            return;
        }

        setIsLoading(true);

        try {
            const response = await axios.get(
                route('guild.users.duties', user.id),
            );
            const [user_data, current_sum, all_sum] = response.data;
            setDuties(user_data.duties || []);
            setTotalCurrent(Number(current_sum) || 0);
            setTotalAll(Number(all_sum) || 0);
        } catch (error) {
            toast.error('Hiba a szolgálati adatok betöltésekor.');
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (is_open && user) {
            fetchDuties();
        } else {
            setDuties([]);
            resetManual();
            setPeriodFilter('current');
            setSelectedRows([]);
        }
    }, [is_open, user, fetchDuties]);

    const previewCurrent = useMemo(
        () =>
            formatDuty(
                total_current +
                    (parseInt(String(manual_data.current_adj), 10) || 0),
            ),
        [total_current, manual_data.current_adj],
    );
    const previewAll = useMemo(
        () =>
            formatDuty(
                total_all +
                    (parseInt(String(manual_data.current_adj), 10) || 0) +
                    (parseInt(String(manual_data.all_adj), 10) || 0),
            ),
        [total_all, manual_data.current_adj, manual_data.all_adj],
    );

    const handleAdjustment = (status: number) => {
        const value =
            status === 0 ? manual_data.current_adj : manual_data.all_adj;
        const minutes = parseInt(String(value), 10) || 0;

        if (minutes === 0) {
            return;
        }

        router.post(
            route('duty.store'),
            {
                guild_user_id: user!.id,
                value: minutes,
                status,
                started_at: new Date().toISOString(),
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    resetManual();
                    fetchDuties();
                },
            },
        );
    };

    const handleUpdateStatus = (duty_ids: (string | number)[], targetStatus: number) => {
        const numericIds = duty_ids.map(id => Number(id));

        router.put(
            route('duty.update.status'),
            {
                duty_ids: numericIds,
                status: targetStatus,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSelectedRows([]);
                    fetchDuties();
                },
                onError: () => toast.error('Hiba a státusz frissítésekor.'),
            },
        );
    };

    const confirmDelete = () => {
        setDeleteState((prev) => ({ ...prev, is_processing: true }));

        if (delete_state.is_bulk) {
            router.delete(route('duty.bulk.delete'), {
                data: {
                    duty_ids: selected_rows,
                    status: period_filter === 'current' ? 0 : 1,
                },
                preserveScroll: true,
                onSuccess: () => {
                    setSelectedRows([]);
                    fetchDuties();
                    setDeleteState({
                        is_open: false,
                        is_bulk: false,
                        duty_id: null,
                        is_processing: false,
                    });
                },
                onError: () =>
                    setDeleteState((prev) => ({
                        ...prev,
                        is_processing: false,
                    })),
            });
        } else if (delete_state.duty_id !== null) {
            router.delete(route('duty.delete', delete_state.duty_id), {
                preserveScroll: true,
                onSuccess: () => {
                    fetchDuties();
                    setDeleteState({
                        is_open: false,
                        is_bulk: false,
                        duty_id: null,
                        is_processing: false,
                    });
                },
                onError: () =>
                    setDeleteState((prev) => ({
                        ...prev,
                        is_processing: false,
                    })),
            });
        }
    };

    const sorted_duties = useMemo(() => {
        const filtered = duties.filter((d) =>
            period_filter === 'current'
                ? String(d.status) === '0'
                : Number(d.status) <= 1,
        );

        return filtered.sort((a, b) => {
            const a_val = a[sort_column as keyof Duty];
            const b_val = b[sort_column as keyof Duty];
            const factor = sort_direction === 'asc' ? 1 : -1;

            return a_val! < b_val! ? -1 * factor : 1 * factor;
        });
    }, [duties, period_filter, sort_column, sort_direction]);

    const { currentData, currentPage, totalPages, setPage } =
        useClientPagination(sorted_duties, 5);

    const handleFilterChange = (v: any) => {
        setPeriodFilter(v);
        setSelectedRows([]);
        setPage(1);
    };

    const duty_columns: ColumnDef<Duty>[] = [
        {
            id: 'value',
            label: 'Mentett idő',
            sortable: true,
            render: (row) => (
                <span className="font-semibold">{formatDuty(row.value)}</span>
            ),
        },
        {
            id: 'started_at',
            label: 'Szolgálatba lépés',
            sortable: true,
            render: (row) => new Date(row.started_at).toLocaleString(),
        },
        {
            id: 'finished_at',
            label: 'Szolgálatból kilépés',
            sortable: true,
            render: (row) =>
                row.finished_at
                    ? new Date(row.finished_at).toLocaleString()
                    : 'Folyamatban',
        },
    ];

    if (!user) {
        return null;
    }

    return (
        <>
            <Dialog open={is_open} onOpenChange={(open) => !open && onClose()}>
                <DialogContent className="flex max-h-[90vh] max-w-4xl flex-col overflow-hidden p-0 sm:max-w-5xl">
                    <div className="p-6 pb-2">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Clock className="h-5 w-5 text-primary" />
                                Szolgálati idő kezelése:{' '}
                                {user.ic_name || user.user?.name}
                            </DialogTitle>
                            <DialogDescription>
                                Szolgálati idő manuális módosítása és a korábbi
                                tevékenységek listája.
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="flex-1 overflow-y-auto px-6 pb-6">
                        <Accordion
                            type="single"
                            collapsible
                            defaultValue="current"
                            className="mb-8 w-full rounded-lg border bg-muted/30 px-4"
                        >
                            <AccordionItem
                                value="current"
                                className="border-b border-border/50"
                            >
                                <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                                    Aktuális szolgálati idő módosítása
                                </AccordionTrigger>
                                <AccordionContent className="pt-2 pb-4">
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                                        <div className="flex-1 space-y-2">
                                            <Label
                                                htmlFor="current-adj"
                                                className="text-xs text-muted-foreground"
                                            >
                                                Módosítás (perc)
                                            </Label>
                                            <Input
                                                id="current-adj"
                                                type="number"
                                                placeholder="Pl.: 5 vagy -5"
                                                value={manual_data.current_adj}
                                                onChange={(e) =>
                                                    setManualData(
                                                        'current_adj',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <Label className="text-xs text-muted-foreground">
                                                Várható új érték
                                            </Label>
                                            <div className="flex h-10 items-center rounded-md border bg-muted/50 px-3 font-mono font-bold">
                                                {previewCurrent}
                                            </div>
                                        </div>
                                        <div className="mt-2 flex sm:mt-0">
                                            <Button
                                                disabled={
                                                    is_processing ||
                                                    !manual_data.current_adj
                                                }
                                                onClick={() =>
                                                    handleAdjustment(0)
                                                }
                                            >
                                                <Edit className="mr-2 h-4 w-4" />{' '}
                                                Módosítás
                                            </Button>
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="all" className="border-b-0">
                                <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                                    Összes szolgálati idő módosítása
                                </AccordionTrigger>
                                <AccordionContent className="pt-2 pb-4">
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                                        <div className="flex-1 space-y-2">
                                            <Label
                                                htmlFor="all-adj"
                                                className="text-xs text-muted-foreground"
                                            >
                                                Módosítás (perc)
                                            </Label>
                                            <Input
                                                id="all-adj"
                                                type="number"
                                                placeholder="Pl.: 5 vagy -5"
                                                value={manual_data.all_adj}
                                                onChange={(e) =>
                                                    setManualData(
                                                        'all_adj',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <Label className="text-xs text-muted-foreground">
                                                Várható új érték
                                            </Label>
                                            <div className="flex h-10 items-center rounded-md border bg-muted/50 px-3 font-mono font-bold">
                                                {previewAll}
                                            </div>
                                        </div>
                                        <div className="mt-2 flex sm:mt-0">
                                            <Button
                                                disabled={
                                                    is_processing ||
                                                    !manual_data.all_adj
                                                }
                                                onClick={() =>
                                                    handleAdjustment(1)
                                                }
                                            >
                                                <Edit className="mr-2 h-4 w-4" />{' '}
                                                Módosítás
                                            </Button>
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>

                        <div className="mt-6 space-y-4 border-t pt-6">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <h3 className="text-lg font-semibold tracking-tight">
                                    Előzmények
                                </h3>
                                <div className="flex items-center gap-3">
                                    <Select
                                        value={period_filter}
                                        onValueChange={handleFilterChange}
                                    >
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="current">
                                                Jelenlegi időszak
                                            </SelectItem>
                                            <SelectItem value="all">
                                                Minden időszak
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>

                                    {selected_rows.length > 0 && (
                                        <div className="flex items-center gap-2">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="shadow-sm"
                                                    >
                                                        <FolderInput className="mr-2 h-4 w-4" />{' '}
                                                        Státusz váltás
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        onClick={() =>
                                                            handleUpdateStatus(
                                                                selected_rows,
                                                                0,
                                                            )
                                                        }
                                                    >
                                                        Áthelyezés jelenlegi
                                                        időszakba
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() =>
                                                            handleUpdateStatus(
                                                                selected_rows,
                                                                1,
                                                            )
                                                        }
                                                    >
                                                        Áthelyezés minden
                                                        időszakba (Archiválás)
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>

                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() =>
                                                    setDeleteState({
                                                        is_open: true,
                                                        is_bulk: true,
                                                        duty_id: null,
                                                        is_processing: false,
                                                    })
                                                }
                                                className="shadow-sm"
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />{' '}
                                                Törlés ({selected_rows.length})
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {is_loading ? (
                                <div className="flex justify-center p-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : (
                                <div className="rounded-md border bg-background">
                                    <DataTable<Duty>
                                        data={currentData}
                                        columns={duty_columns}
                                        key_field="id"
                                        selected_rows={selected_rows}
                                        onSelectionChange={setSelectedRows}
                                        sort_column={sort_column}
                                        sort_direction={sort_direction}
                                        onSort={(c) => {
                                            setSortDirection(
                                                sort_column === c &&
                                                    sort_direction === 'asc'
                                                    ? 'desc'
                                                    : 'asc',
                                            );
                                            setSortColumn(c);
                                        }}
                                        actions={(row) => {
                                            const currentStatus = String(
                                                row.status,
                                            );
                                            const targetStatus =
                                                currentStatus === '0' ? 1 : 0;
                                            const tooltipTitle =
                                                currentStatus === '0'
                                                    ? 'Áthelyezés minden időszakba'
                                                    : 'Áthelyezés jelenlegi időszakba';

                                            return (
                                                <div className="flex justify-end gap-1">
                                                    <TooltipProvider
                                                        delayDuration={200}
                                                    >
                                                        <Tooltip>
                                                            <TooltipTrigger
                                                                asChild
                                                            >
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() =>
                                                                        handleUpdateStatus(
                                                                            [
                                                                                row.id,
                                                                            ],
                                                                            targetStatus,
                                                                        )
                                                                    }
                                                                >
                                                                    <ArrowRightLeft className="h-4 w-4 text-muted-foreground transition-colors hover:text-primary" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                {tooltipTitle}
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>

                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-destructive hover:bg-destructive/10"
                                                        onClick={() =>
                                                            setDeleteState({
                                                                is_open: true,
                                                                is_bulk: false,
                                                                duty_id: row.id,
                                                                is_processing: false,
                                                            })
                                                        }
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            );
                                        }}
                                        empty_message="Nincsenek mentett szolgálati idők."
                                    />
                                    <DataTablePagination
                                        currentPage={currentPage}
                                        totalPages={totalPages}
                                        onPageChange={setPage}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <ConfirmDeleteDialog
                isOpen={delete_state.is_open}
                onClose={() => setDeleteState(prev => ({ ...prev, is_open: false }))}
                onConfirm={confirmDelete}
                isProcessing={delete_state.is_processing}
                description="Biztosan törölni szeretnéd a kijelölt eleme(ke)t? Ezzel az összesített idő is csökkenni fog."
            />
        </>
    );
}
