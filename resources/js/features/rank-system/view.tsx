import { Gem } from 'lucide-react';
import React, { useMemo } from 'react';
import InputError from '@/components/input-error';
import SearchableSingleSelect from '@/components/searchable-single-select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Combobox,
    ComboboxChip,
    ComboboxChips,
    ComboboxChipsInput,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxItem,
    ComboboxList,
    ComboboxValue,
    useComboboxAnchor,
} from '@/components/ui/combobox';
import { Label } from '@/components/ui/label';
import {
    getChannelName,
    getRoleColor,
    getRoleName,
} from '@/lib/discord-helpers';
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

    const role_ids = roles.map((r: any) => r.id);

    const rank_anchor = useComboboxAnchor();

    const rank_system_data = data || {};
    const ordered_ranks_value = Array.isArray(rank_system_data.ordered_ranks)
        ? rank_system_data.ordered_ranks
        : [];

    return (
        <div className="animate-in space-y-6 duration-500 fade-in">
            <div className="space-y-2 border-b pb-6">
                <Label>
                    Felépített Ranglétra (Sorrendben! A legkisebbtől a
                    legnagyobbig)
                </Label>
                <Combobox
                    multiple
                    autoHighlight
                    items={role_ids}
                    value={ordered_ranks_value}
                    onValueChange={(val) =>
                        onChange('ordered_ranks', val as string[])
                    }
                >
                    <ComboboxChips
                        ref={rank_anchor}
                        className={`w-full ${errors['settings.rank_system.ordered_ranks'] ? 'border-destructive' : ''}`}
                    >
                        <ComboboxValue>
                            {(values: string[]) => {
                                const safe_values = Array.isArray(values)
                                    ? values
                                    : [];

                                return (
                                    <React.Fragment>
                                        {safe_values.map((val, index) => (
                                            <ComboboxChip
                                                key={val}
                                                className="border-primary/20"
                                            >
                                                <span className="mr-1.5 font-mono text-xs opacity-50">
                                                    {index + 1}.
                                                </span>
                                                <div className="flex items-center gap-1.5">
                                                    <span
                                                        className="h-2 w-2 rounded-full"
                                                        style={{
                                                            backgroundColor:
                                                                getRoleColor(
                                                                    val,
                                                                    roles,
                                                                ),
                                                        }}
                                                    />
                                                    {getRoleName(val, roles)}
                                                </div>
                                            </ComboboxChip>
                                        ))}
                                        <ComboboxChipsInput placeholder="Keresés rangokra..." />
                                    </React.Fragment>
                                );
                            }}
                        </ComboboxValue>
                    </ComboboxChips>
                    <ComboboxContent anchor={rank_anchor}>
                        <ComboboxEmpty>Nincs találat.</ComboboxEmpty>
                        <ComboboxList>
                            {(item: string) => (
                                <ComboboxItem key={item} value={item}>
                                    <div className="flex items-center gap-2">
                                        <span
                                            className="h-2 w-2 rounded-full"
                                            style={{
                                                backgroundColor: getRoleColor(
                                                    item,
                                                    roles,
                                                ),
                                            }}
                                        />
                                        {getRoleName(item, roles)}
                                    </div>
                                </ComboboxItem>
                            )}
                        </ComboboxList>
                    </ComboboxContent>
                </Combobox>
                <p className="mt-2 text-xs text-muted-foreground">
                    Tipp: A rangokat abban a sorrendben kattintsd be, ahogy a
                    hierarchia felépül.
                </p>
                <InputError message={errors['settings.rank_system.ordered_ranks']} />
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
                <InputError message={errors['settings.rank_system.archive_duties_on_promotion']} />
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
                    renderItem={(item) => item.label}
                />

                <InputError
                    message={errors['settings.rank_system.announcement_channel_id']}
                />
            </div>

            <div className="space-y-2">
                <Label>Rang Rendszer Log Szoba</Label>
                <SearchableSingleSelect
                    items={text_channel_options}
                    value={rank_system_data.log_channel_id}
                    onChange={(val) => onChange('log_channel_id', val)}
                    placeholder="Keresés szöveges csatornára..."
                    renderItem={(item) => item.label}
                />
                <InputError message={errors['settings.rank_system.log_channel_id']} />
            </div>
        </div>
    );
}
