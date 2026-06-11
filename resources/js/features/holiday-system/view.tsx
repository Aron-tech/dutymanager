import React, { useMemo } from 'react';
import InputError from '@/components/input-error';
import { RoleSelect } from '@/components/RoleSelect';
import SearchableSingleSelect from '@/components/searchable-single-select';
import { Label } from '@/components/ui/label';
import { getChannelName } from '@/lib/discord-helpers';
import type { FeatureViewProps } from '@/types';

export default function HolidaySystemView({
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

    const holiday_data = data || {};

    return (
        <div className="animate-in space-y-6 duration-500 fade-in">
            <div className="space-y-2 border-b pb-6">
                <Label>Szabadság Rang</Label>
                <RoleSelect
                    roles={roles}
                    value={holiday_data.holiday_role_id || ''}
                    onChange={(val) => onChange('holiday_role_id', val)}
                    placeholder="Keresés rangra..."
                />
                <p className="mt-2 text-xs text-muted-foreground">
                    Ezt a rangot kapja meg a felhasználó, amíg szabadságon van.
                </p>
                <InputError message={errors['holiday_role_id']} />
            </div>

            <div className="space-y-2">
                <Label>Szabadság Felhívás Szoba (Opcionális)</Label>
                <SearchableSingleSelect
                    items={text_channel_options}
                    value={holiday_data.announcement_channel_id || ''}
                    onChange={(val) => onChange('announcement_channel_id', val)}
                    placeholder="Keresés szöveges csatornára..."
                    renderItem={(item) => <span>{item.label}</span>}
                />
                <InputError message={errors['announcement_channel_id']} />
            </div>
        </div>
    );
}
