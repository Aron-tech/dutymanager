import React, { useMemo } from 'react';
import InputError from '@/components/input-error';
import { MultiRoleSelect } from '@/components/MultiRoleSelect';
import SearchableSingleSelect from '@/components/searchable-single-select';
import { Label } from '@/components/ui/label';
import { getChannelName } from '@/lib/discord-helpers';
import type { FeatureViewProps } from '@/types';

export default function WarningSystemView({
    data,
    context_data,
    errors,
    onChange,
}: FeatureViewProps) {
    const text_channels = context_data.discord_text_channels || [];
    const roles = context_data.discord_roles || [];

    const text_channel_options = useMemo(
        () =>
            text_channels.map((c: any) => ({
                value: c.id,
                label: `#${getChannelName(c.id, text_channels)}`,
            })),
        [text_channels],
    );

    const warning_roles_value = Array.isArray(data.warning_roles)
        ? data.warning_roles
        : [];

    return (
        <div className="animate-in space-y-6 duration-500 fade-in">
            <div className="space-y-2 border-b pb-6">
                <Label>Figyelmeztetési Rangok (Sorrendben)</Label>
                <MultiRoleSelect
                    roles={roles}
                    value={warning_roles_value}
                    onChange={(val) => onChange('warning_roles', val)}
                    useSelectionOrder
                    placeholder="Figyelmeztetési rangok..."
                    className={errors['warning_roles'] ? 'border-destructive' : ''}
                />
                <p className="mt-2 text-xs text-muted-foreground">
                    A rangokat sorrendben add meg. Az 1. a legelső figyelmeztetéskor járó rang.
                </p>
                <InputError message={errors['warning_roles']} />
            </div>

            <div className="space-y-2">
                <Label>Figyelmeztetési Felhívás Szoba (Opcionális)</Label>
                <SearchableSingleSelect
                    items={text_channel_options}
                    value={data.announcement_channel_id}
                    onChange={(val) => onChange('announcement_channel_id', val)}
                    placeholder="Keresés szöveges csatornára..."
                    renderItem={(item) => <span>{item.label}</span>}
                />
                <InputError message={errors['announcement_channel_id']} />
            </div>
        </div>
    );
}
