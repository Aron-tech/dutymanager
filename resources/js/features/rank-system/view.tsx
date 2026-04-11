import { Gem } from 'lucide-react';
import React from 'react';
import InputError from '@/components/input-error';
import SearchableSingleSelect from '@/components/searchable-single-select';
import { Badge } from '@/components/ui/badge';
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
    const channels = context_data.channels || [];
    const roles = context_data.discord_roles || [];
    const hasPremium = context_data.has_premium || false;

    const channelIds = channels.map((c: any) => c.id);
    const roleIds = roles.map((r: any) => r.id);

    const rankAnchor = useComboboxAnchor();
    const orderedRanks = Array.isArray(data.ordered_ranks)
        ? data.ordered_ranks
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
                    items={roleIds}
                    value={orderedRanks}
                    onValueChange={(val) =>
                        onChange('ordered_ranks', val as string[])
                    }
                >
                    <ComboboxChips
                        ref={rankAnchor}
                        className={`w-full ${errors['settings.ordered_ranks'] ? 'border-destructive' : ''}`}
                    >
                        <ComboboxValue>
                            {(values: string[]) => {
                                const safeValues = Array.isArray(values)
                                    ? values
                                    : [];

                                return (
                                    <React.Fragment>
                                        {safeValues.map((val, index) => (
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
                    <ComboboxContent anchor={rankAnchor}>
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
                <InputError message={errors['settings.ordered_ranks']} />
            </div>

            <div className="relative space-y-2 overflow-hidden rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                {!hasPremium && (
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

                {/* JAVÍTÁS: Sokkal rövidebb lett az új közös komponenssel! */}
                <SearchableSingleSelect
                    items={channelIds}
                    value={data.announcement_channel_id}
                    onChange={(val) => onChange('announcement_channel_id', val)}
                    placeholder="Keresés csatornára..."
                    renderItem={(id) => `#${getChannelName(id, channels)}`}
                />

                <InputError
                    message={errors['settings.announcement_channel_id']}
                />
            </div>
        </div>
    );
}
