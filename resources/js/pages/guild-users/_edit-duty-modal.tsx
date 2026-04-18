import { useForm, router } from '@inertiajs/react';
import axios from 'axios';
import { Clock, Trash2, Edit, Loader2 } from 'lucide-react';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { DataTable  } from '@/components/data-table';
import type {ColumnDef} from '@/components/data-table';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
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
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { formatDuty } from '@/lib/utils';
import type { GuildUser, Duty } from '@/types';

interface EditDutyModalProps {
    is_open: boolean;
    onClose: () => void;
    user: GuildUser | null;
}

export default function EditDutyModal({ is_open, onClose, user }: EditDutyModalProps) {
    const [period_filter, setPeriodFilter] = useState<'current' | 'all'>('current');
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

    const { data: manual_data, setData: setManualData, reset: resetManual, processing: is_processing } = useForm({
        current_adj: '' as string | number,
        all_adj: '' as string | number,
    });

    const fetchDuties = useCallback(async () => {
        if (!user) {
            return;
        }

        setIsLoading(true);

        try {
            const response = await axios.get(route('guild.users.duties', user.id));
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

    const previewCurrent = useMemo(() => {
        const adj = parseInt(String(manual_data.current_adj), 10) || 0;

        return formatDuty(total_current + adj);
    }, [total_current, manual_data.current_adj]);

    const previewAll = useMemo(() => {
        const c_adj = parseInt(String(manual_data.current_adj), 10) || 0;
        const a_adj = parseInt(String(manual_data.all_adj), 10) || 0;

        return formatDuty(total_all + c_adj + a_adj);
    }, [total_all, manual_data.current_adj, manual_data.all_adj]);

    const handleAdjustment = (status: number) => {
        const value = status === 0 ? manual_data.current_adj : manual_data.all_adj;
        const minutes = parseInt(String(value), 10) || 0;

        if (minutes === 0) {
            return;
        }

        router.post(route('duty.store'), {
            guild_user_id: user!.id,
            value: minutes,
            status: status,
            started_at: new Date().toISOString(),
        }, {
            preserveScroll: true,
            onSuccess: () => {
                resetManual();
                fetchDuties();
            }
        });
    };
    const confirmDelete = () => {
        setDeleteState((prev) => ({ ...prev, is_processing: true }));

        if (delete_state.is_bulk) {
            router.delete(route('duty.bulk.delete'), {
                data: {
                    duty_ids: selected_rows,
                    status: period_filter === 'current' ? 0 : 1
                },
                preserveScroll: true,
                onSuccess: () => {
                    setSelectedRows([]);
                    fetchDuties();
                    setDeleteState({ is_open: false, is_bulk: false, duty_id: null, is_processing: false });
                },
                onError: (errors) => {
                    console.error(errors);
                    setDeleteState((prev) => ({ ...prev, is_processing: false }));
                }
            });
        } else if (delete_state.duty_id !== null) {
            router.delete(route('duty.delete', delete_state.duty_id), {
                preserveScroll: true,
                onSuccess: () => {
                    fetchDuties();
                    setDeleteState({ is_open: false, is_bulk: false, duty_id: null, is_processing: false });
                },
                onError: () => {
                    setDeleteState((prev) => ({ ...prev, is_processing: false }));
                }
            });
        }
    };

    const sorted_duties = useMemo(() => {
        const filtered = duties.filter(d => period_filter === 'current' ? String(d.status) === '0' : Number(d.status) <= 1);

        return filtered.sort((a, b) => {
            const a_val = a[sort_column as keyof Duty];
            const b_val = b[sort_column as keyof Duty];
            const factor = sort_direction === 'asc' ? 1 : -1;

            return a_val! < b_val! ? -1 * factor : 1 * factor;
        });
    }, [duties, period_filter, sort_column, sort_direction]);

    const duty_columns: ColumnDef<Duty>[] = [
        { id: 'value', label: 'Mentett idő', sortable: true, render: (row) => <span className="font-semibold">{formatDuty(row.value)}</span> },
        { id: 'started_at', label: 'Szolgálatba lépés', sortable: true, render: (row) => new Date(row.started_at).toLocaleString() },
        { id: 'finished_at', label: 'Szolgálatból kilépés', sortable: true, render: (row) => row.finished_at ? new Date(row.finished_at).toLocaleString() : 'Folyamatban' },
    ];

    if (!user) {
        return null;
    }

    return (
        <>
            <Dialog open={is_open} onOpenChange={(open) => !open && onClose()}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[800px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2"><Clock className="h-5 w-5" /> {user.ic_name || user.user?.name} szolgálati ideje</DialogTitle>
                    </DialogHeader>

                    {is_loading ? (
                        <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
                    ) : (
                        <div className="space-y-6 py-4">
                            <Accordion type="single" collapsible defaultValue="current" className="w-full">
                                <AccordionItem value="current">
                                    <AccordionTrigger className="text-sm font-semibold">Aktuális szolgálati idő módosítása</AccordionTrigger>
                                    <AccordionContent className="pt-4">
                                        <div className="flex items-center gap-4">
                                            <div className="flex-1 space-y-1">
                                                <Label className="text-xs text-muted-foreground">Módosítás (perc)</Label>
                                                <Input type="number" placeholder="5" value={manual_data.current_adj} onChange={(e) => setManualData('current_adj', e.target.value)} />
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <Label className="text-xs text-muted-foreground">Várható új érték</Label>
                                                <div className="flex h-10 items-center rounded-md border bg-muted/50 px-3 font-mono font-bold">{previewCurrent}</div>
                                            </div>
                                            <div className="mt-5 flex gap-2">
                                                <Button variant="outline" size="icon" disabled={is_processing || !manual_data.current_adj} onClick={() => handleAdjustment(0)}><Edit className="h-4 w-4" /></Button>
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="all">
                                    <AccordionTrigger className="text-sm font-semibold">Összes szolgálati idő módosítása</AccordionTrigger>
                                    <AccordionContent className="pt-4">
                                        <div className="flex items-center gap-4">
                                            <div className="flex-1 space-y-1">
                                                <Label className="text-xs text-muted-foreground">Módosítás (perc)</Label>
                                                <Input type="number" placeholder="5" value={manual_data.all_adj} onChange={(e) => setManualData('all_adj', e.target.value)} />
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <Label className="text-xs text-muted-foreground">Várható új érték</Label>
                                                <div className="flex h-10 items-center rounded-md border bg-muted/50 px-3 font-mono font-bold">{previewAll}</div>
                                            </div>
                                            <div className="mt-5 flex gap-2">
                                                <Button variant="outline" size="icon" disabled={is_processing || !manual_data.all_adj} onClick={() => handleAdjustment(1)}><Edit className="h-4 w-4" /></Button>
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold">Előzmények</h3>
                                    <Select value={period_filter} onValueChange={(v: any) => {
 setPeriodFilter(v); setSelectedRows([]);
}}>
                                        <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="current">Current period</SelectItem>
                                            <SelectItem value="all">All period</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                {selected_rows.length > 0 && (
                                    <div className="flex items-center justify-between rounded-lg border bg-muted/50 px-4 py-2">
                                        <span className="text-sm font-medium">{selected_rows.length} elem kijelölve</span>
                                        <Button variant="destructive" size="sm" onClick={() => setDeleteState({ is_open: true, is_bulk: true, duty_id: null, is_processing: false })}>Tömeges törlés</Button>
                                    </div>
                                )}
                                <div className="rounded-md border bg-background">
                                    <DataTable<Duty>
                                        data={sorted_duties} columns={duty_columns} key_field="id"
                                        selected_rows={selected_rows} onSelectionChange={setSelectedRows}
                                        sort_column={sort_column} sort_direction={sort_direction} onSort={(c) => {
 setSortDirection(sort_column === c && sort_direction === 'asc' ? 'desc' : 'asc'); setSortColumn(c);
}}
                                        actions={(row) => <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteState({ is_open: true, is_bulk: false, duty_id: row.id, is_processing: false })}><Trash2 className="h-4 w-4" /></Button>}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <AlertDialog open={delete_state.is_open} onOpenChange={(open) => !open && !delete_state.is_processing && setDeleteState(prev => ({ ...prev, is_open: false }))}>
                <AlertDialogContent size="sm">
                    <AlertDialogHeader>
                        <AlertDialogMedia className="bg-destructive/10 text-destructive"><Trash2 className="h-6 w-6" /></AlertDialogMedia>
                        <AlertDialogTitle>Megerősítés</AlertDialogTitle>
                        <AlertDialogDescription>Biztosan törölni szeretnéd a kijelölt eleme(ke)t?</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={delete_state.is_processing}>Mégse</AlertDialogCancel>
                        <AlertDialogAction variant="destructive" onClick={confirmDelete} disabled={delete_state.is_processing}>{delete_state.is_processing ? 'Folyamatban...' : 'Törlés'}</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

const Label = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <label className={`text-sm font-medium leading-none ${className}`}>{children}</label>
);
