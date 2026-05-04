import React, { useMemo } from 'react';
import InputError from '@/components/input-error';
import SearchableSingleSelect from '@/components/searchable-single-select';
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

    const role_ids = roles.map((r: any) => r.id);
    const role_anchor = useComboboxAnchor();

    const warning_roles_value = Array.isArray(data.warning_roles)
        ? data.warning_roles
        : [];

    return (
        <div className="animate-in space-y-6 duration-500 fade-in">
            <div className="space-y-2 border-b pb-6">
                <Label>Figyelmeztetési Rangok (Sorrendben)</Label>
                <Combobox
                    multiple
                    autoHighlight
                    items={role_ids}
                    value={warning_roles_value}
                    onValueChange={(val) => onChange('warning_roles', val as string[])}
                >
                    <ComboboxChips
                        ref={role_anchor}
                        className={`w-full ${errors['warning_roles'] ? 'border-destructive' : ''}`}
                    >
                        <ComboboxValue>
                            {(values: string[]) => {
                                const safe_values = Array.isArray(values) ? values : [];

                                return (
                                    <React.Fragment>
                                        {safe_values.map((val, index) => (
                                            <ComboboxChip key={val} className="border-primary/20">
                                                <span className="mr-1.5 font-mono text-xs opacity-50">
                                                    {index + 1}.
                                                </span>
                                                <div className="flex items-center gap-1.5">
                                                    <span
                                                        className="h-2 w-2 rounded-full"
                                                        style={{ backgroundColor: getRoleColor(val, roles) }}
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
                    <ComboboxContent anchor={role_anchor}>
                        <ComboboxEmpty>Nincs találat.</ComboboxEmpty>
                        <ComboboxList>
                            {(item: string) => (
                                <ComboboxItem key={item} value={item}>
                                    <div className="flex items-center gap-2">
                                        <span
                                            className="h-2 w-2 rounded-full"
                                            style={{ backgroundColor: getRoleColor(item, roles) }}
                                        />
                                        {getRoleName(item, roles)}
                                    </div>
                                </ComboboxItem>
                            )}
                        </ComboboxList>
                    </ComboboxContent>
                </Combobox>
                <p className="mt-2 text-xs text-muted-foreground">
                    A rangokat sorrendben add meg. Az 1. a legelső figyelmeztetéskor járó rang.
                </p>
                <InputError message={errors['warning_roles']} />
            </div>

            <div className="space-y-2">
                <Label>Figyelmeztetési Felhívás Szoba</Label>
                <SearchableSingleSelect
                    items={text_channel_options}
                    value={data.announcement_channel_id}
                    onChange={(val) => onChange('announcement_channel_id', val)}
                    placeholder="Keresés szöveges csatornára..."
                    renderItem={(item) => item.label}
                />
                <InputError message={errors['announcement_channel_id']} />
            </div>

            <div className="space-y-2">
                <Label>Figyelmeztetések Log Szoba</Label>
                <SearchableSingleSelect
                    items={text_channel_options}
                    value={data.log_channel_id}
                    onChange={(val) => onChange('log_channel_id', val)}
                    placeholder="Keresés szöveges csatornára..."
                    renderItem={(item) => item.label}
                />
                <InputError message={errors['log_channel_id']} />
            </div>
        </div>
    );
}
