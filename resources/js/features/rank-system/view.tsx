import { Gem } from 'lucide-react';
import React, { useMemo } from 'react';
import InputError from '@/components/input-error';
import { MultiRoleSelect } from '@/components/MultiRoleSelect';
import SearchableSingleSelect from '@/components/searchable-single-select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { getChannelName } from '@/lib/discord-helpers';
import type { FeatureViewProps } from '@/types';

export default function RankSystemView({
    data,
    context_data,
    errors,
    onChange,
}: FeatureViewProps) {
    const text_channels = context_data.discord_text_channels || [];
    const roles = context_data.discord_roles || [];
    const has_premium = context_data.has_premium || false;

    const text_channel_options = useMemo(
        () =>
            text_channels.map((c: any) => ({
                value: c.id,
                label: `#${getChannelName(c.id, text_channels)}`,
            })),
        [text_channels],
    );

    const rank_system_data = data || {};
    const rank_roles_value = Array.isArray(rank_system_data.rank_roles)
        ? rank_system_data.rank_roles
        : [];

    return (
        <div className="animate-in space-y-6 duration-500 fade-in">
            <div className="space-y-2 border-b pb-6">
                <Label>
                    Felépített Ranglétra (Sorrendben! A legkisebbtől a
                    legnagyobbig)
                </Label>
                <MultiRoleSelect
                    roles={roles}
                    value={rank_roles_value}
                    onChange={(val) => onChange('rank_roles', val)}
                    useSelectionOrder
                    placeholder="Rangok keresése..."
                    className={errors['rank_roles'] ? 'border-destructive' : ''}
                />
                <p className="mt-2 text-xs text-muted-foreground">
                    Tipp: A rangokat abban a sorrendben kattintsd be, ahogy a
                    hierarchia felépül.
                </p>
                <InputError message={errors['rank_roles']} />
            </div>

            <div className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                <Checkbox
                    id="archive_duties_on_promotion"
                    checked={rank_system_data.archive_duties_on_promotion ?? false}
                    onCheckedChange={(checked) =>
                        onChange('archive_duties_on_promotion', checked)
                    }
                />
                <div className="space-y-1 leading-none">
                    <Label htmlFor="archive_duties_on_promotion">
                        Rang változás esetén az aktuális duty idők automatikusan archiváltak közé kerüljenek
                    </Label>
                    <p className="text-sm text-muted-foreground">
                        Ha be van kapcsolva, az előléptetés/lefokozás során a felhasználó aktív periódusban lévő duty ideje lezárul és archiválódik.
                    </p>
                </div>
                <InputError message={errors['archive_duties_on_promotion']} />
            </div>

            <div className="relative space-y-2 overflow-hidden rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                {!has_premium && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-background/50 backdrop-blur-[1px]">
                        <Badge
                            variant="outline"
                            className="border-none bg-amber-500 text-white"
                        >
                            <Gem className="mr-1 h-3 w-3" />
                            Prémium szükséges
                        </Badge>
                    </div>
                )}
                <Label className="flex items-center gap-1.5 text-amber-600">
                    <Gem className="h-4 w-4" /> Előléptetés/Lefokozás felhívás
                    szoba (Opcionális)
                </Label>

                <SearchableSingleSelect
                    items={text_channel_options}
                    value={rank_system_data.announcement_channel_id}
                    onChange={(val) => onChange('announcement_channel_id', val)}
                    placeholder="Keresés szöveges csatornára..."
                    renderItem={(item) => <span>{item.label}</span>}
                />

                <InputError message={errors['announcement_channel_id']} />
            </div>
        </div>
    );
}
