import { useForm } from '@inertiajs/react';
import { Clock } from 'lucide-react';
import React, { useEffect } from 'react';
import { toast } from 'sonner';
import SearchableSingleSelect from '@/components/searchable-single-select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import type {
    GuildUser,
    Rank,
    UserDetailsConfig,
    SelectItem as DiscordSelectItem,
} from '@/types';

interface CreateEditUserModalProps {
    is_open: boolean;
    onClose: () => void;
    edit_user?: GuildUser | null;
    onEditDuty?: (user: GuildUser) => void;
    user_details_config: UserDetailsConfig[];
    unattached_guild_users: DiscordSelectItem[];
    has_rank_system: boolean;
    available_ranks: Rank[];
    is_request_mode?: boolean;
    target_discord_id?: string;
}

export default function CreateEditUserModal({
                                                is_open,
                                                onClose,
                                                edit_user,
                                                onEditDuty,
                                                user_details_config,
                                                unattached_guild_users,
                                                has_rank_system,
                                                available_ranks,
                                                is_request_mode = false,
                                                target_discord_id,
                                            }: CreateEditUserModalProps) {
    const is_edit = !!edit_user;

    const {
        data: form_data,
        setData: setFormData,
        post,
        put,
        processing: is_submitting,
        errors: form_errors,
        reset,
        clearErrors,
    } = useForm({
        user_id: '',
        name: '',
        ic_name: '',
        rank_id: '',
        details: {} as Record<string, any>,
        config_data: {} as Record<string, any>, // A backend a requestJoin metódusban ezt várja
    });

    useEffect(() => {
        if (is_open) {
            if (is_edit && edit_user) {
                setFormData({
                    user_id: edit_user.user_id,
                    name: edit_user.user?.name || '',
                    ic_name: edit_user.ic_name || '',
                    rank_id: (edit_user as any).rank_id?.toString() || '',
                    details: edit_user.details || {},
                    config_data: {},
                });
            } else {
                reset();

                if (has_rank_system && available_ranks?.length > 0) {
                    setFormData('rank_id', available_ranks[0].id.toString());
                }
            }

            clearErrors();
        }
    }, [
        is_open,
        edit_user,
        has_rank_system,
        available_ranks,
        is_edit,
        clearErrors,
        setFormData,
        reset,
    ]);

    const handleSubmit = () => {
        if (is_request_mode && target_discord_id) {
            post(route('guild.users.store', target_discord_id), {
                preserveScroll: true,
                onSuccess: () => {
                    onClose();
                    reset();
                },
                onError: (errors) => {
                    if (errors.form_error) {
                        toast.error(errors.form_error);
                    }
                },
            });
        } else if (is_edit && edit_user) {
            // Felhasználó szerkesztése admin felületről
            put(route('guild.users.update', edit_user.id), {
                preserveScroll: true,
                onSuccess: () => {
                    onClose();
                    reset();
                },
                onError: (errors) => {
                    if (errors.form_error) {
                        toast.error(errors.form_error);
                    }
                },
            });
        } else {
            // Felhasználó létrehozása admin felületről
            post(route('guild.users.store'), {
                preserveScroll: true,
                onSuccess: () => {
                    onClose();
                    reset();
                },
                onError: (errors) => {
                    if (errors.form_error) {
                        toast.error(errors.form_error);
                    }
                },
            });
        }
    };

    const handleUserSelect = (val: string) => {
        const selected_user = unattached_guild_users.find((u) => u.value === val);

        setFormData((prev) => ({
            ...prev,
            user_id: val,
            name: selected_user ? (selected_user as any).name : '',
            ic_name: !prev.ic_name && selected_user ? selected_user.label : prev.ic_name,
        }));

        clearErrors('user_id');

        if (selected_user && !form_data.ic_name) {
            clearErrors('ic_name');
        }
    };

    return (
        <Dialog open={is_open} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        {is_request_mode
                            ? 'Csatlakozási kérelem'
                            : is_edit
                                ? `Felhasználó szerkesztése - ${edit_user?.ic_name || edit_user?.user?.name}`
                                : 'Új felhasználó hozzáadása'}
                    </DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    {/* CSAK LÉTREHOZÁSKOR ÉS NEM KÉRELEM ESETÉN LÁTSZIK A DISCORD KIVÁLASZTÓ */}
                    {!is_edit && !is_request_mode && (
                        <div className="space-y-2">
                            <Label>
                                Discord Felhasználó <span className="text-destructive">*</span>
                            </Label>
                            <SearchableSingleSelect
                                items={unattached_guild_users}
                                value={form_data.user_id}
                                onChange={handleUserSelect}
                                placeholder="Keresés szerver tagok között..."
                                renderItem={(item) => item.label}
                            />
                            {form_errors.user_id && (
                                <p className="text-sm font-medium text-destructive">{form_errors.user_id}</p>
                            )}
                        </div>
                    )}

                    {!is_request_mode && (
                        <div className="space-y-2">
                            <Label htmlFor="ic_name">
                                IC Név <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="ic_name"
                                value={form_data.ic_name}
                                onChange={(e) => {
                                    setFormData('ic_name', e.target.value);
                                    clearErrors('ic_name');
                                }}
                            />
                            {form_errors.ic_name && (
                                <p className="text-sm font-medium text-destructive">{form_errors.ic_name}</p>
                            )}
                        </div>
                    )}

                    {has_rank_system && available_ranks.length > 0 && !is_request_mode && (
                        <div className="space-y-2">
                            <Label>
                                Duty Rang <span className="text-destructive">*</span>
                            </Label>
                            <Select
                                value={form_data.rank_id}
                                onValueChange={(val) => {
                                    setFormData('rank_id', val);
                                    clearErrors('rank_id');
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Válassz rangot" />
                                </SelectTrigger>
                                <SelectContent>
                                    {available_ranks.map((rank) => (
                                        <SelectItem key={rank.id} value={rank.id.toString()}>
                                            {rank.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {form_errors.rank_id && (
                                <p className="text-sm font-medium text-destructive">{form_errors.rank_id}</p>
                            )}
                        </div>
                    )}

                    {user_details_config.map((config) => (
                        <div key={config.name} className="space-y-2">
                            <Label>
                                {config.name} {config.required && <span className="text-destructive">*</span>}
                            </Label>
                            {config.type === 'bool' ? (
                                <div className="flex h-10 items-center">
                                    <Checkbox
                                        checked={is_request_mode ? !!form_data.config_data[config.name] : !!form_data.details[config.name]}
                                        onCheckedChange={(checked) => {
                                            if (is_request_mode) {
                                                setFormData('config_data', {
                                                    ...form_data.config_data,
                                                    [config.name]: checked === true,
                                                });
                                                clearErrors(`config_data.${config.name}`);
                                            } else {
                                                setFormData('details', {
                                                    ...form_data.details,
                                                    [config.name]: checked === true,
                                                });
                                                clearErrors(`details.${config.name}`);
                                            }
                                        }}
                                    />
                                </div>
                            ) : (
                                <Input
                                    type={config.type === 'int' || config.type === 'float' ? 'number' : 'text'}
                                    value={is_request_mode ? (form_data.config_data[config.name] || '') : (form_data.details[config.name] || '')}
                                    onChange={(e) => {
                                        if (is_request_mode) {
                                            setFormData('config_data', {
                                                ...form_data.config_data,
                                                [config.name]: e.target.value,
                                            });
                                            clearErrors(`config_data.${config.name}`);
                                        } else {
                                            setFormData('details', {
                                                ...form_data.details,
                                                [config.name]: e.target.value,
                                            });
                                            clearErrors(`details.${config.name}`);
                                        }
                                    }}
                                />
                            )}
                            {form_errors[is_request_mode ? `config_data.${config.name}` : `details.${config.name}`] && (
                                <p className="text-sm font-medium text-destructive">
                                    {form_errors[is_request_mode ? `config_data.${config.name}` : `details.${config.name}`]}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
                <DialogFooter className="sm:justify-between">
                    <div>
                        {is_edit && onEditDuty && !is_request_mode && (
                            <Button type="button" variant="secondary" onClick={() => onEditDuty(edit_user!)}>
                                <Clock className="mr-2 h-4 w-4" /> Duty szerkesztése
                            </Button>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onClose} disabled={is_submitting}>
                            Mégse
                        </Button>
                        <Button onClick={handleSubmit} disabled={is_submitting}>
                            {is_request_mode ? 'Jelentkezés' : is_edit ? 'Mentés' : 'Hozzáadás'}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
