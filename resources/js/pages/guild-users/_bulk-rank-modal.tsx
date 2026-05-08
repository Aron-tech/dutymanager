import { useForm } from '@inertiajs/react';
import React from 'react';
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

interface BulkRankModalProps {
    is_open: boolean;
    onClose: () => void;
    selected_ids: (string | number)[];
}

export default function BulkRankModal({ is_open, onClose, selected_ids }: BulkRankModalProps) {
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

    const handleSubmit = () => {
        post(route('guild.users.bulk.rank'), {
            preserveScroll: true,
            onSuccess: () => {
                onClose();
                reset();
                toast.success('Ranks updated successfully.');
            },
            onError: (errors: any) => {
                if (errors.form_error) {
                    toast.error(errors.form_error);
                } else {
                    toast.error('An unknown error occurred.');
                }
            },
        });
    };

    return (
        <Dialog open={is_open} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Bulk Rank Update</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label>Action</Label>
                        <Select
                            value={form_data.action}
                            onValueChange={(val: 'promote' | 'demote') => setFormData('action', val)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select an action" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="promote">Promote</SelectItem>
                                <SelectItem value="demote">Demote</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="level">Level</Label>
                        <Input
                            id="level"
                            type="number"
                            min="1"
                            max="10"
                            value={form_data.level}
                            onChange={(e) => setFormData('level', parseInt(e.target.value, 10))}
                        />
                        {form_errors.level && (
                            <p className="text-sm font-medium text-destructive">{form_errors.level}</p>
                        )}
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={is_submitting}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={is_submitting}>
                        Update Ranks
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
