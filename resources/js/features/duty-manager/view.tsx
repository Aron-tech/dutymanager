import { Gem } from 'lucide-react';
import React, { useMemo } from 'react';
import InputError from '@/components/input-error';
import SearchableSingleSelect from '@/components/searchable-single-select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
    getChannelName,
    getRoleColor,
    getRoleName,
} from '@/lib/discord-helpers';
import type { FeatureViewProps } from '@/types';

export default function DutyManagerView({
    data,
    context_data,
    errors,
    onChange,
}: FeatureViewProps) {
    const text_channels = context_data.discord_text_channels || [];
    const voice_channels = context_data.discord_voice_channels || [];
    const roles = context_data.discord_roles || [];
    const has_premium = context_data.has_premium || false;

    // Opciók generálása a kereséshez
    const role_options = useMemo(
        () =>
            roles.map((r: any) => ({
                value: r.id,
                label: getRoleName(r.id, roles),
            })),
        [roles],
    );

    const text_channel_options = useMemo(
        () =>
            text_channels.map((c: any) => ({
                value: c.id,
                label: `#${getChannelName(c.id, text_channels)}`,
            })),
        [text_channels],
    );

    const voice_channel_options = useMemo(
        () =>
            voice_channels.map((c: any) => ({
                value: c.id,
                label: `🔊 ${getChannelName(c.id, voice_channels)}`,
            })),
        [voice_channels],
    );

    return (
        <div className="animate-in space-y-6 duration-500 fade-in">
            {/* --- DUTY RANG --- */}
            <div className="space-y-2">
                <Label>Duty Rang</Label>
                <SearchableSingleSelect
                    items={role_options}
                    value={data.duty_role_id}
                    onChange={(val) => onChange('duty_role_id', val)}
                    placeholder="Keresés rang alapján..."
                    renderItem={(item) => (
                        <div className="flex items-center gap-2">
                            <span
                                className="h-2.5 w-2.5 rounded-full"
                                style={{
                                    backgroundColor: getRoleColor(
                                        item.value,
                                        roles,
                                    ),
                                }}
                            />
                            {item.label}
                        </div>
                    )}
                />
                <InputError message={errors['settings.duty_role_id']} />
            </div>

            {/* --- DUTY PANEL SZÓBA --- */}
            <div className="space-y-2">
                <Label>Duty Panel Szoba</Label>
                <SearchableSingleSelect
                    items={text_channel_options}
                    value={data.duty_panel_channel_id}
                    onChange={(val) => onChange('duty_panel_channel_id', val)}
                    placeholder="Keresés szöveges csatornára..."
                    renderItem={(item) => item.label}
                />
                <InputError
                    message={errors['settings.duty_panel_channel_id']}
                />
            </div>

            {/* --- DUTY VOICE SZÓBA --- */}
            <div className="relative space-y-2 overflow-hidden rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                {!has_premium && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-[1px]">
                        <Badge
                            variant="outline"
                            className="border-none bg-amber-500 text-white"
                        >
                            <Gem className="mr-1 h-3 w-3" /> Prémium szükséges
                        </Badge>
                    </div>
                )}
                <Label className="flex items-center gap-1.5 text-amber-600">
                    <Gem className="h-4 w-4" /> Duty Voice Szoba (Opcionális)
                </Label>
                <SearchableSingleSelect
                    items={voice_channel_options}
                    value={data.duty_voice_channel_id}
                    onChange={(val) => onChange('duty_voice_channel_id', val)}
                    placeholder="Keresés voice csatornára..."
                    renderItem={(item) => item.label}
                />
                <InputError
                    message={errors['settings.duty_voice_channel_id']}
                />
            </div>

            {/* --- AKTÍV LÉTSZÁM MEGJELENÍTŐ --- */}
            <div className="space-y-2">
                <Label>Aktív Duty létszám megjelenítő (Opcionális)</Label>
                <SearchableSingleSelect
                    items={voice_channel_options}
                    value={data.active_duty_channel_id}
                    onChange={(val) => onChange('active_duty_channel_id', val)}
                    placeholder="Keresés statisztika csatornára..."
                    renderItem={(item) => item.label}
                />
                <InputError
                    message={errors['settings.active_duty_channel_id']}
                />
            </div>

            {/* --- DUTY LOG SZÓBA --- */}
            <div className="space-y-2">
                <Label>Duty Log Szoba</Label>
                <SearchableSingleSelect
                    items={text_channel_options}
                    value={data.duty_log_channel_id}
                    onChange={(val) => onChange('duty_log_channel_id', val)}
                    placeholder="Keresés szöveges csatornára..."
                    renderItem={(item) => item.label}
                />
                <InputError message={errors['settings.duty_log_channel_id']} />
            </div>
        </div>
    );
}
