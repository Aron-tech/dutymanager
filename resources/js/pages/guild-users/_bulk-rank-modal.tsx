import { useForm, usePage } from '@inertiajs/react';
import React, { useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
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
import type { GuildUser, PageProps } from '@/types';

interface BulkRankModalProps {
    is_open: boolean;
    onClose: () => void;
    selected_ids: (string | number)[];
}

export default function BulkRankModal({ is_open, onClose, selected_ids }: BulkRankModalProps) {
    const { props } = usePage<PageProps>();
    const { guild_users, rank_roles, all_ranks } = props;

    const {
        data: form_data,
        setData: setFormData,
        post,
        processing: is_submitting,
        errors: form_errors,
        reset,
    } = useForm({
        action: 'promote',
        level: 1,
        guild_user_ids: selected_ids,
    });

    useEffect(() => {
        setFormData('guild_user_ids', selected_ids);
    }, [selected_ids]);

    const selected_users = useMemo(() => {
        return guild_users.data.filter((user) => selected_ids.includes(user.id));
    }, [guild_users.data, selected_ids]);

    const { current_rank_name, next_rank_name } = useMemo(() => {
        if (selected_users.length !== 1 || !rank_roles || !all_ranks) {
            return { current_rank_name: 'N/A', next_rank_name: 'N/A' };
        }

        const user = selected_users[0];
        const rank_data = user.data?.rank_role;
        const current_rank_id = rank_data ? Object.keys(rank_data)[0] : null;
        const current_rank_index = current_rank_id ? rank_roles.indexOf(current_rank_id) : -1;

        let next_rank_index: number;
        if (form_data.action === 'promote') {
            next_rank_index = Math.min(current_rank_index + form_data.level, rank_roles.length - 1);
        } else {
            next_rank_index = Math.max(current_rank_index - form_data.level, 0);
        }

        const next_rank_id = rank_roles[next_rank_index];

        return {
            current_rank_name: current_rank_id ? all_ranks[current_rank_id] : 'Nincs rang',
            next_rank_name: all_ranks[next_rank_id] || 'N/A',
        };
    }, [selected_users, rank_roles, all_ranks, form_data.action, form_data.level]);

    const handleSubmit = () => {
        post(route('guild.users.bulk.rank'), {
            preserveScroll: true,
            onSuccess: () => {
                onClose();
                reset();
                toast.success('A rangok frissítése sikeresen megtörtént.');
            },
            onError: (errors: any) => {
                if (errors.form_error) {
                    toast.error(errors.form_error);
                } else {
                    toast.error('Ismeretlen hiba történt.');
                }
            },
        });
    };

    return (
        <Dialog open={is_open} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Rang Módosítása</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    {selected_users.length === 1 && (
                        <div className="space-y-2 text-sm">
                            <p>Felhasználó: <span className="font-semibold">{selected_users[0].ic_name}</span></p>
                            <p>Jelenlegi rang: <span className="font-semibold">{current_rank_name}</span></p>
                            <p>Új rang: <span className="font-semibold">{next_rank_name}</span></p>
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label>Művelet</Label>
                        <Select
                            value={form_data.action}
                            onValueChange={(val: 'promote' | 'demote') => setFormData('action', val)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Válassz egy műveletet" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="promote">Előléptetés</SelectItem>
                                <SelectItem value="demote">Lefokozás</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="level">Szint</Label>
                        <Input
                            id="level"
                            type="number"
                            min="1"
                            max="10"
                            value={form_data.level}
                            onChange={(e) => setFormData('level', parseInt(e.target.value, 10) || 1)}
                        />
                        {form_errors.level && (
                            <p className="text-sm font-medium text-destructive">{form_errors.level}</p>
                        )}
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={is_submitting}>
                        Mégse
                    </Button>
                    <Button onClick={handleSubmit} disabled={is_submitting}>
                        Rangok frissítése
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
