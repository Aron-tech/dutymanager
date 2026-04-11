import { Plus, Trash2, ListPlus, Gem } from 'lucide-react';
import React, { useState, useMemo } from 'react';
import InputError from '@/components/input-error';
import SearchableSingleSelect from '@/components/searchable-single-select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { getChannelName } from '@/lib/discord-helpers';
import type { FeatureViewProps } from '@/types';

const DATA_TYPES = [
    { value: 'string', label: 'Szöveg (String)' },
    { value: 'int', label: 'Egész szám (Integer)' },
    { value: 'float', label: 'Tizedes tört (Float)' },
    { value: 'bool', label: 'Igen/Nem (Boolean)' },
];

export default function UserDetailsView({
    data,
    context_data,
    errors,
    onChange,
}: FeatureViewProps) {
    const [new_name, setNewName] = useState('');
    const [new_type, setNewType] = useState('string');
    const [new_required, setNewRequired] = useState(false);

    const text_channels = context_data.discord_text_channels || [];

    // Csatorna opciók generálása a név alapú kereséshez
    const channel_options = useMemo(
        () =>
            text_channels.map((c: any) => ({
                value: c.id,
                label: `#${getChannelName(c.id, text_channels)}`,
            })),
        [text_channels],
    );

    const has_premium =
        context_data.has_premium ||
        (context_data.subscriptions && context_data.subscriptions.length > 0) ||
        false;

    const config_items = Array.isArray(data.config) ? data.config : [];
    const is_limit_reached = config_items.length >= 3 && !has_premium;

    const handleAddConfig = () => {
        if (!new_name.trim() || is_limit_reached) {
            return;
        }

        const new_item = {
            name: new_name.trim(),
            type: new_type,
            required: new_required,
        };
        onChange('config', [...config_items, new_item]);

        setNewName('');
        setNewType('string');
        setNewRequired(false);
    };

    const handleRemoveConfig = (index: number) => {
        const updated = config_items.filter((_, i) => i !== index);
        onChange('config', updated);
    };

    const handleUpdateConfig = (
        index: number,
        field: 'name' | 'type' | 'required',
        value: any,
    ) => {
        const updated = [...config_items];
        updated[index] = { ...updated[index], [field]: value };
        onChange('config', updated);
    };

    return (
        <div className="animate-in space-y-8 duration-500 fade-in">
            <div className="space-y-6 border-b pb-6">
                <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label>Adatváltozás Log Szoba (Opcionális)</Label>
                        <SearchableSingleSelect
                            items={channel_options}
                            value={data.log_channel_id}
                            onChange={(val) => onChange('log_channel_id', val)}
                            placeholder="Keresés csatornára..."
                            renderItem={(item) => item.label}
                        />
                        <InputError
                            message={errors['settings.log_channel_id']}
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <Label className="flex items-center gap-2 text-base font-semibold text-foreground">
                            <ListPlus className="h-5 w-5 text-primary" />
                            Extra Felhasználói Mezők (Opcionális)
                        </Label>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Ingyenesen maximum 3 további adatot kérhetsz be a
                            tagoktól.
                        </p>
                    </div>
                    <Badge variant="secondary" className="hidden sm:flex">
                        {config_items.length} / {has_premium ? 'Végtelen' : '3'}{' '}
                        mező
                    </Badge>
                </div>

                <div className="relative overflow-hidden rounded-lg border-2 border-dashed border-primary/40 bg-primary/5 p-4 transition-all">
                    {is_limit_reached && (
                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
                            <Badge
                                variant="outline"
                                className="mb-2 border-amber-500 bg-amber-500 text-white shadow-lg"
                            >
                                <Gem className="mr-1 h-3 w-3" /> Prémium Limit
                                Elérve
                            </Badge>
                            <p className="text-xs font-medium text-muted-foreground">
                                Több mező felvételéhez prémium előfizetés
                                szükséges.
                            </p>
                        </div>
                    )}

                    <div
                        className={`flex flex-col gap-4 sm:flex-row sm:items-end ${is_limit_reached ? 'pointer-events-none opacity-30' : ''}`}
                    >
                        <div className="flex-1 space-y-1.5">
                            <Label className="text-xs font-semibold text-primary uppercase">
                                Új mező neve
                            </Label>
                            <Input
                                placeholder="Pl. Életkor, Telefonszám..."
                                value={new_name}
                                onChange={(e) => setNewName(e.target.value)}
                                onKeyDown={(e) =>
                                    e.key === 'Enter' &&
                                    (e.preventDefault(), handleAddConfig())
                                }
                            />
                        </div>
                        <div className="w-full space-y-1.5 sm:w-[180px]">
                            <Label className="text-xs font-semibold text-primary uppercase">
                                Adattípus
                            </Label>
                            <Select value={new_type} onValueChange={setNewType}>
                                <SelectTrigger className="bg-background">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {DATA_TYPES.map((type) => (
                                        <SelectItem
                                            key={type.value}
                                            value={type.value}
                                        >
                                            {type.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center gap-2 pb-2.5 sm:px-2">
                            <Checkbox
                                id="new-required"
                                checked={new_required}
                                onCheckedChange={(checked) =>
                                    setNewRequired(checked as boolean)
                                }
                            />
                            <Label
                                htmlFor="new-required"
                                className="cursor-pointer text-sm"
                            >
                                Kötelező
                            </Label>
                        </div>

                        <Button
                            type="button"
                            onClick={handleAddConfig}
                            disabled={!new_name.trim() || is_limit_reached}
                            className="w-full sm:w-auto"
                        >
                            <Plus className="mr-1.5 h-4 w-4" /> Hozzáadás
                        </Button>
                    </div>
                </div>

                <InputError message={errors['settings.config']} />

                <div className="mt-6 space-y-3">
                    {config_items.length === 0 ? (
                        <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground italic">
                            Jelenleg nincsenek extra mezők beállítva.
                        </div>
                    ) : (
                        config_items.map((item: any, index: number) => (
                            <div
                                key={index}
                                className="flex flex-col gap-4 rounded-lg border bg-card p-3 shadow-sm transition-all hover:shadow-md sm:flex-row sm:items-center"
                            >
                                <div className="flex-1">
                                    <Input
                                        value={item.name}
                                        onChange={(e) =>
                                            handleUpdateConfig(
                                                index,
                                                'name',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Mező neve..."
                                        className="border-transparent bg-muted/50 hover:border-input focus:bg-background"
                                    />
                                </div>
                                <div className="w-full sm:w-[180px]">
                                    <Select
                                        value={item.type}
                                        onValueChange={(val) =>
                                            handleUpdateConfig(
                                                index,
                                                'type',
                                                val,
                                            )
                                        }
                                    >
                                        <SelectTrigger className="border-transparent bg-muted/50 hover:border-input focus:bg-background">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {DATA_TYPES.map((type) => (
                                                <SelectItem
                                                    key={type.value}
                                                    value={type.value}
                                                >
                                                    {type.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex items-center gap-2 pl-2">
                                    <Checkbox
                                        id={`req-${index}`}
                                        checked={item.required || false}
                                        onCheckedChange={(checked) =>
                                            handleUpdateConfig(
                                                index,
                                                'required',
                                                checked,
                                            )
                                        }
                                    />
                                    <Label
                                        htmlFor={`req-${index}`}
                                        className="cursor-pointer text-sm whitespace-nowrap"
                                    >
                                        Kötelező
                                    </Label>
                                </div>

                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleRemoveConfig(index)}
                                    className="w-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive sm:w-10"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
