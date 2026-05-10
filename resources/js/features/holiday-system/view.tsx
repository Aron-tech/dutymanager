import React, { useMemo } from 'react';
import InputError from '@/components/input-error';
import SearchableSingleSelect from '@/components/searchable-single-select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    getChannelName,
    getRoleName,
} from '@/lib/discord-helpers';
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

    const role_options = useMemo(
        () =>
            roles.map((r: any) => ({
                value: r.id,
                label: getRoleName(r.id, roles),
            })),
        [roles],
    );

    // Default üzenet inicializálása
    const default_message = '**{user}** szabadságra ment. Tervezett visszatérés: **{ended_at}** \nIndok: {reason}';

    // Biztosítjuk, hogy a data egy objektum
    const holiday_data = data || {};

    return (
        <div className="animate-in space-y-6 duration-500 fade-in">
            <div className="space-y-2 border-b pb-6">
                <Label>Szabadság Rang</Label>
                <SearchableSingleSelect
                    items={role_options}
                    value={holiday_data.holiday_role_id || ''}
                    onChange={(val) => onChange('holiday_role_id', val)}
                    placeholder="Keresés rangra..."
                    renderItem={(item) => item.label}
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
                    renderItem={(item) => item.label}
                />
                <InputError message={errors['announcement_channel_id']} />
            </div>

            {holiday_data.announcement_channel_id && (
                <div className="space-y-2 animate-in fade-in duration-300">
                    <Label>Felhívás Üzenet Szövege</Label>
                    <Textarea
                        value={holiday_data.announcement_message ?? default_message}
                        onChange={(e) => onChange('announcement_message', e.target.value)}
                        placeholder={default_message}
                        rows={3}
                    />
                    <p className="text-xs text-muted-foreground">
                        Használható változók: <code className="bg-muted px-1 py-0.5 rounded">{'{user}'}</code>, <code className="bg-muted px-1 py-0.5 rounded">{'{ended_at}'}</code>, <code className="bg-muted px-1 py-0.5 rounded">{'{reason}'}</code>
                    </p>
                    <InputError message={errors['announcement_message']} />
                </div>
            )}
        </div>
    );
}
