import axios from 'axios';
import { ShieldAlert, Trash2, Search, Loader2 } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { DataTable } from '@/components/data-table';
import type { ColumnDef } from '@/components/data-table';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { GuildUser, Punishment } from '@/types';

interface EditPunishmentModalProps {
    is_open: boolean;
    onClose: () => void;
    user: GuildUser | null;
}

export default function EditPunishmentModal({
                                                is_open,
                                                onClose,
                                                user,
                                            }: EditPunishmentModalProps) {
    const [is_loading, setIsLoading] = useState(false);
    const [is_submitting, setIsSubmitting] = useState(false);

    // Adatok a backendről
    const [punishments, setPunishments] = useState<Punishment[]>([]);
    const [available_types, setAvailableTypes] = useState<Record<string, string>>({});

    // Form state
    const [type, setType] = useState<string>('');
    const [reason, setReason] = useState('');
    const [duration_days, setDurationDays] = useState('');

    // Table state
    const [search_query, setSearchQuery] = useState('');
    const [sort_column, setSortColumn] = useState('created_at');
    const [sort_direction, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [selected_rows, setSelectedRows] = useState<(string | number)[]>([]);

    // Törlés állapot
    const [delete_state, setDeleteState] = useState<{
        is_open: boolean;
        is_bulk: boolean;
        punishment_id: number | null;
        is_processing: boolean;
    }>({ is_open: false, is_bulk: false, punishment_id: null, is_processing: false });

    useEffect(() => {
        if (is_open && user) {
            fetchPunishments();
            setReason('');
            setDurationDays('');
            setSearchQuery('');
            setSelectedRows([]);
        }
    }, [is_open, user]);

    const fetchPunishments = async () => {
        if (!user) {
            return;
        }

        setIsLoading(true);

        try {
            const response = await axios.get(
                route('guild.users.punishments', user.id),
            );

            setPunishments(response.data.punishments || []);
            setAvailableTypes(response.data.types || {});

            if (response.data.types && Object.keys(response.data.types).length > 0) {
                setType(Object.keys(response.data.types)[0]);
            }
        } catch (error) {
            toast.error('Hiba történt a büntetések lekérésekor.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            return;
        }

        setIsSubmitting(true);

        try {
            await axios.post(route('punishments.store'), {
                guild_user_id: user.id,
                type,
                reason,
                duration_days: duration_days ? parseInt(duration_days) : null,
            });

            toast.success('Büntetés sikeresen kiosztva.');
            setReason('');
            setDurationDays('');
            fetchPunishments();
        } catch (error: any) {
            toast.error(
                error.response?.data?.message || 'Hiba történt a mentés során.',
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBulkDelete = async () => {
        setDeleteState({ is_open: true, is_bulk: true, punishment_id: null, is_processing: false });
    };

    const confirmDelete = async () => {
        setDeleteState((prev) => ({ ...prev, is_processing: true }));

        try {
            const ids_to_delete = delete_state.is_bulk ? selected_rows : [delete_state.punishment_id];

            await axios.delete(route('punishments.bulk-destroy'), {
                data: { ids: ids_to_delete },
            });

            toast.success(delete_state.is_bulk ? 'Kijelölt büntetések visszavonva/törölve.' : 'Büntetés visszavonva/törölve.');

            if (delete_state.is_bulk) {
                setSelectedRows([]);
            }

            fetchPunishments();
            setDeleteState({ is_open: false, is_bulk: false, punishment_id: null, is_processing: false });
        } catch (error) {
            toast.error('Hiba történt a törlés során.');
            setDeleteState((prev) => ({ ...prev, is_processing: false }));
        }
    };

    const formatDate = (
        date_string: string | undefined,
        fallback: string = 'Végleges',
    ) => {
        if (!date_string) {
            return fallback;
        }

        return new Date(date_string).toLocaleString();
    };

    const filtered_and_sorted_data = useMemo(() => {
        let result = [...punishments];

        if (search_query) {
            const q = search_query.toLowerCase();
            result = result.filter(
                (p) =>
                    p.reason.toLowerCase().includes(q) ||
                    (available_types[p.type] || p.type).toLowerCase().includes(q) ||
                    (p.created_by_user?.name || '').toLowerCase().includes(q),
            );
        }

        result.sort((a: any, b: any) => {
            let valA = a[sort_column];
            let valB = b[sort_column];

            if (sort_column === 'created_by') {
                valA = a.created_by_user?.name || '';
                valB = b.created_by_user?.name || '';
            } else if (sort_column === 'status') {
                const getStatusWeight = (p: Punishment) => {
                    if (p.deleted_at) {
                        return 0;
                    }

                    if (p.expires_at && new Date(p.expires_at) < new Date()) {
                        return 1;
                    }

                    return 2;
                };
                valA = getStatusWeight(a);
                valB = getStatusWeight(b);
            }

            if (valA < valB) {
                return sort_direction === 'asc' ? -1 : 1;
            }

            if (valA > valB) {
                return sort_direction === 'asc' ? 1 : -1;
            }

            return 0;
        });

        return result;
    }, [punishments, search_query, sort_column, sort_direction, available_types]);

    const handleSort = (col_id: string) => {
        const new_dir = sort_column === col_id && sort_direction === 'asc' ? 'desc' : 'asc';
        setSortColumn(col_id);
        setSortDirection(new_dir);
    };

    const columns: ColumnDef<Punishment>[] = [
        {
            id: 'type',
            label: 'Típus',
            sortable: true,
            render: (row) => (
                <span className="font-medium">
                    {available_types[row.type] || row.type}
                </span>
            ),
        },
        {
            id: 'level',
            label: 'Szint',
            sortable: true,
            render: (row) => row.level || '-',
        },
        {
            id: 'reason',
            label: 'Indok',
            sortable: true,
            render: (row) => (
                <div className="max-w-[200px] truncate" title={row.reason}>
                    {row.reason}
                </div>
            ),
        },
        {
            id: 'created_by',
            label: 'Kiosztó',
            sortable: true,
            render: (row) => row.created_by_user?.name || 'Ismeretlen',
        },
        {
            id: 'created_at',
            label: 'Kiosztva',
            sortable: true,
            render: (row) => formatDate(row.created_at, ''),
        },
        {
            id: 'expires_at',
            label: 'Lejárat',
            sortable: true,
            render: (row) => (
                <span
                    className={
                        !row.expires_at ? 'font-semibold text-destructive' : ''
                    }
                >
                    {formatDate(row.expires_at, 'Végleges')}
                </span>
            ),
        },
        {
            id: 'status',
            label: 'Státusz',
            sortable: true,
            render: (row) => {
                if (row.deleted_at) {
                    return (
                        <Badge
                            variant="secondary"
                            className="text-muted-foreground"
                        >
                            Visszavonva
                        </Badge>
                    );
                }

                if (row.expires_at && new Date(row.expires_at) < new Date()) {
                    return (
                        <Badge
                            variant="outline"
                            className="border-muted-foreground/30 text-muted-foreground"
                        >
                            Lejárt
                        </Badge>
                    );
                }

                return (
                    <Badge
                        variant="default"
                        className="bg-green-500 hover:bg-green-600"
                    >
                        Aktív
                    </Badge>
                );
            },
        },
    ];

    return (
        <>
            <Dialog open={is_open} onOpenChange={(open) => !open && onClose()}>
                <DialogContent className="flex max-h-[90vh] max-w-4xl flex-col overflow-hidden p-0 sm:max-w-5xl">
                    <div className="p-6 pb-2">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <ShieldAlert className="h-5 w-5 text-destructive" />
                                Büntetések kezelése: {user?.ic_name}
                            </DialogTitle>
                            <DialogDescription>
                                Új büntetés kiosztása és az eddigi előzmények megtekintése.
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="flex-1 overflow-y-auto px-6 pb-6">
                        {/* Új büntetés form (Összecsukható) */}
                        <Accordion type="single" collapsible className="mb-8 w-full rounded-lg border bg-muted/30 px-4">
                            <AccordionItem value="new-punishment" className="border-b-0">
                                <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                                    Új büntetés hozzáadása
                                </AccordionTrigger>
                                <AccordionContent className="pt-2 pb-4">
                                    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                                        <div className="flex flex-col gap-2">
                                            <Label htmlFor="punishment-type">Típus</Label>
                                            <Select value={type} onValueChange={setType}>
                                                <SelectTrigger id="punishment-type">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Object.entries(available_types).map(([val, label]) => (
                                                        <SelectItem key={val} value={val}>
                                                            {label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <Label htmlFor="punishment-reason">Indok</Label>
                                            <Textarea
                                                id="punishment-reason"
                                                value={reason}
                                                onChange={(e) => setReason(e.target.value)}
                                                placeholder="Add meg a büntetés pontos okát..."
                                                rows={3}
                                                required
                                                className="resize-y"
                                            />
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <Label htmlFor="punishment-duration">Időtartam (napban)</Label>
                                            <Input
                                                id="punishment-duration"
                                                type="number"
                                                min="1"
                                                value={duration_days}
                                                onChange={(e) => setDurationDays(e.target.value)}
                                                placeholder="Ha üresen hagyod, a büntetés végleges lesz."
                                            />
                                        </div>

                                        <div className="pt-2 flex justify-end">
                                            <Button
                                                type="submit"
                                                disabled={is_submitting || !reason.trim()}
                                                className="w-full sm:w-auto"
                                            >
                                                {is_submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                Büntetés kiosztása
                                            </Button>
                                        </div>
                                    </form>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>

                        {/* Előzmények Szekció */}
                        <div className="space-y-4 border-t pt-6">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <h3 className="text-lg font-semibold tracking-tight">Előzmények</h3>
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Keresés az előzményekben..."
                                            className="w-[250px] pl-9"
                                            value={search_query}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                    {selected_rows.length > 0 && (
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={handleBulkDelete}
                                            className="shadow-sm"
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Visszavonás ({selected_rows.length})
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {is_loading ? (
                                <div className="flex justify-center p-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : (
                                <div className="rounded-md border bg-background">
                                    <DataTable<Punishment>
                                        data={filtered_and_sorted_data}
                                        columns={columns}
                                        key_field="id"
                                        selected_rows={selected_rows}
                                        onSelectionChange={setSelectedRows}
                                        is_row_selectable={(row) => !row.deleted_at}
                                        sort_column={sort_column}
                                        sort_direction={sort_direction}
                                        onSort={handleSort}
                                        actions={(row) => (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive hover:bg-destructive/10"
                                                onClick={() => setDeleteState({ is_open: true, is_bulk: false, punishment_id: row.id, is_processing: false })}
                                                disabled={!!row.deleted_at}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                        empty_message="A felhasználónak nincsenek rögzített büntetései az előzményekben."
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <AlertDialog open={delete_state.is_open} onOpenChange={(open) => !open && !delete_state.is_processing && setDeleteState(prev => ({ ...prev, is_open: false }))}>
                <AlertDialogContent size="sm">
                    <AlertDialogHeader>
                        <AlertDialogMedia className="bg-destructive/10 text-destructive"><Trash2 className="h-6 w-6" /></AlertDialogMedia>
                        <AlertDialogTitle>Megerősítés</AlertDialogTitle>
                        <AlertDialogDescription>Biztosan szeretnéd visszavonni/törölni a kijelölt büntetés(eke)t?</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={delete_state.is_processing}>Mégse</AlertDialogCancel>
                        <AlertDialogAction variant="destructive" onClick={confirmDelete} disabled={delete_state.is_processing}>
                            {delete_state.is_processing ? 'Folyamatban...' : 'Törlés / Visszavonás'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
