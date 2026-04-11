import { X } from 'lucide-react';
import React from 'react';
import InputError from '@/components/input-error';
import {
    Combobox,
    ComboboxChip,
    ComboboxChips,
    ComboboxChipsInput,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
    ComboboxValue,
    useComboboxAnchor,
} from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { FeatureViewProps } from '@/types';

export default function WarningSystemView({
    data,
    context_data,
    errors,
    onChange,
}: FeatureViewProps) {
    const channels = context_data.channels || [];
    const roles = context_data.discord_roles || [];

    const channelIds = channels.map((c: any) => c.id);
    const roleIds = roles.map((r: any) => r.id);

    const getChannelName = (id: string) =>
        channels.find((c: any) => c.id === id)?.name || id;
    const getRoleName = (id: string) =>
        roles.find((r: any) => r.id === id)?.name || id;
    const getRoleColor = (id: string) => {
        const role = roles.find((r: any) => r.id === id);

        return !role || !role.color
            ? '#99aab5'
            : typeof role.color === 'number'
              ? `#${role.color.toString(16).padStart(6, '0')}`
              : role.color;
    };

    const roleAnchor = useComboboxAnchor();
    const warningRoles = Array.isArray(data.warning_roles)
        ? data.warning_roles
        : [];

    return (
        <div className="animate-in space-y-6 duration-500 fade-in">
            <div className="space-y-2">
                <Label>Figyelmeztetési Rangok (Kik oszthatnak ki warn-t)</Label>
                <Combobox
                    multiple
                    autoHighlight
                    items={roleIds}
                    value={warningRoles}
                    onValueChange={(val) =>
                        onChange('warning_roles', val as string[])
                    }
                >
                    <ComboboxChips
                        ref={roleAnchor}
                        className={`w-full ${errors['settings.warning_roles'] ? 'border-destructive' : ''}`}
                    >
                        <ComboboxValue>
                            {(values: string[]) => {
                                const safeValues = Array.isArray(values)
                                    ? values
                                    : [];

                                return (
                                    <React.Fragment>
                                        {safeValues.map((val) => (
                                            <ComboboxChip key={val}>
                                                <div className="flex items-center gap-1.5">
                                                    <span
                                                        className="h-2 w-2 rounded-full"
                                                        style={{
                                                            backgroundColor:
                                                                getRoleColor(
                                                                    val,
                                                                ),
                                                        }}
                                                    />
                                                    {getRoleName(val)}
                                                </div>
                                            </ComboboxChip>
                                        ))}
                                        <ComboboxChipsInput placeholder="Keresés rangokra..." />
                                    </React.Fragment>
                                );
                            }}
                        </ComboboxValue>
                    </ComboboxChips>
                    <ComboboxContent anchor={roleAnchor}>
                        <ComboboxEmpty>Nincs találat.</ComboboxEmpty>
                        <ComboboxList>
                            {(item: string) => (
                                <ComboboxItem key={item} value={item}>
                                    <div className="flex items-center gap-2">
                                        <span
                                            className="h-2 w-2 rounded-full"
                                            style={{
                                                backgroundColor:
                                                    getRoleColor(item),
                                            }}
                                        />
                                        {getRoleName(item)}
                                    </div>
                                </ComboboxItem>
                            )}
                        </ComboboxList>
                    </ComboboxContent>
                </Combobox>
                <InputError message={errors['settings.warning_roles']} />
            </div>

            <div className="space-y-2">
                <Label>Figyelmeztetések Log Szoba</Label>
                <Combobox
                    items={channelIds}
                    value={data.warning_channel_id}
                    onValueChange={(v) => onChange('warning_channel_id', v)}
                >
                    {data.warning_channel_id ? (
                        <div className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm">
                            <span>
                                #{getChannelName(data.warning_channel_id)}
                            </span>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onChange('warning_channel_id', '');
                                }}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    ) : (
                        <ComboboxInput
                            placeholder="Keresés csatornára..."
                            showClear
                        />
                    )}
                    <ComboboxContent>
                        <ComboboxEmpty>Nincs találat.</ComboboxEmpty>
                        <ComboboxList>
                            {(item: string) => (
                                <ComboboxItem key={item} value={item}>
                                    #{getChannelName(item)}
                                </ComboboxItem>
                            )}
                        </ComboboxList>
                    </ComboboxContent>
                </Combobox>
                <InputError message={errors['settings.warning_channel_id']} />
            </div>

            <div className="space-y-2">
                <Label>Automatikus lejárat napokban (Opcionális)</Label>
                <Input
                    type="number"
                    min="1"
                    placeholder="Pl. 30 (üresen hagyva sosem jár le)"
                    value={data.auto_expire_days || ''}
                    onChange={(e) =>
                        onChange('auto_expire_days', e.target.value)
                    }
                />
                <InputError message={errors['settings.auto_expire_days']} />
            </div>
        </div>
    );
}
