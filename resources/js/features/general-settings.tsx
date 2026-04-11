import {
    Plus,
    X,
    User,
    ShieldAlert,
    Crown,
    Gem,
    ExternalLink,
} from 'lucide-react';
import React, { useState } from 'react';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface GeneralSettingsProps {
    data: {
        lang?: string;
        mode?: 'preset' | 'custom';
        subscription_id?: string; // Prémium slot csatolása
        preset_roles?: { user: any; staff: any; owner: any };
        role_permissions?: { role_id: string; permission: string }[];
    };
    context_data: {
        languages: { value: string; label: string }[];
        permissions: { value: string; label: string }[];
        discord_roles: { id: string; name: string; color?: number | string }[];
        subscriptions?: { id: string; name: string }[]; // A backendről érkező szabad/aktív slotok
    };
    onChange: (field: string, value: any) => void;
    errors?: Record<string, string>;
}

export default function GeneralSettings({
    data,
    context_data,
    onChange,
    errors,
}: GeneralSettingsProps) {
    const [selectedRole, setSelectedRole] = useState<string>('');
    const [selectedPerms, setSelectedPerms] = useState<string[]>([]);

    const presetUserAnchor = useComboboxAnchor();
    const presetStaffAnchor = useComboboxAnchor();
    const presetOwnerAnchor = useComboboxAnchor();
    const customPermAnchor = useComboboxAnchor();

    const rolePermissions = data.role_permissions || [];
    const currentMode = data.mode || 'preset';

    const rawPreset = data.preset_roles || {};
    const presetRoles = {
        user: Array.isArray(rawPreset.user)
            ? rawPreset.user
            : rawPreset.user
              ? [rawPreset.user]
              : [],
        staff: Array.isArray(rawPreset.staff)
            ? rawPreset.staff
            : rawPreset.staff
              ? [rawPreset.staff]
              : [],
        owner: Array.isArray(rawPreset.owner)
            ? rawPreset.owner
            : rawPreset.owner
              ? [rawPreset.owner]
              : [],
    };

    const roleIds = context_data.discord_roles?.map((r) => r.id) || [];
    const permValues = context_data.permissions?.map((p) => p.value) || [];
    const subscriptions = context_data.subscriptions || [];

    const handleAddRolePerm = () => {
        if (!selectedRole || selectedPerms.length === 0) {
            return;
        }

        const newPairs = selectedPerms
            .map((perm) => ({ role_id: selectedRole, permission: perm }))
            .filter(
                (newPair) =>
                    !rolePermissions.some(
                        (rp) =>
                            rp.role_id === newPair.role_id &&
                            rp.permission === newPair.permission,
                    ),
            );

        if (newPairs.length > 0) {
            onChange('role_permissions', [...rolePermissions, ...newPairs]);
        }

        setSelectedRole('');
        setSelectedPerms([]);
    };

    const handleRemoveRolePerm = (roleId: string, perm: string) => {
        const updated = rolePermissions.filter(
            (rp) => !(rp.role_id === roleId && rp.permission === perm),
        );
        onChange('role_permissions', updated);
    };

    const handlePresetChange = (
        type: 'user' | 'staff' | 'owner',
        value: string[],
    ) => {
        onChange('preset_roles', { ...presetRoles, [type]: value });
    };

    const getRoleName = (id: string) =>
        context_data.discord_roles?.find((r) => r.id === id)?.name || id;
    const getPermName = (val: string) =>
        context_data.permissions?.find((p) => p.value === val)?.label || val;
    const getRoleColor = (id: string) => {
        const role = context_data.discord_roles?.find((r) => r.id === id);

        if (!role || !role.color) {
            return '#99aab5';
        }

        if (typeof role.color === 'number') {
            return `#${role.color.toString(16).padStart(6, '0')}`;
        }

        return role.color;
    };

    const groupedPermissions = rolePermissions.reduce(
        (acc, curr) => {
            if (!acc[curr.role_id]) {
acc[curr.role_id] = [];
}

            acc[curr.role_id].push(curr.permission);

            return acc;
        },
        {} as Record<string, string[]>,
    );

    return (
        <div className="animate-in space-y-10 duration-500 fade-in slide-in-from-bottom-2">
            {/* FELSŐ BLOKK: Nyelv és Előfizetés */}
            <div className="grid gap-8 border-b pb-8 md:grid-cols-2">
                {/* 1. Nyelv kiválasztása */}
                <div className="space-y-3">
                    <Label className="text-base font-semibold text-foreground">
                        Szerver alapértelmezett nyelve
                    </Label>
                    <Select
                        value={data.lang || ''}
                        onValueChange={(val) => onChange('lang', val)}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Válassz nyelvet..." />
                        </SelectTrigger>
                        <SelectContent>
                            {context_data.languages?.map((lang) => (
                                <SelectItem key={lang.value} value={lang.value}>
                                    {lang.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <InputError message={errors?.['settings.lang']} />
                </div>

                {/* 2. Prémium Előfizetés Csatolása */}
                <div className="space-y-3">
                    <Label className="flex items-center gap-2 text-base font-semibold text-amber-500">
                        <Gem className="h-4 w-4" /> Prémium Előfizetés csatolása
                    </Label>
                    {subscriptions.length > 0 ? (
                        <Select
                            value={data.subscription_id || ''}
                            onValueChange={(val) =>
                                onChange('subscription_id', val)
                            }
                        >
                            <SelectTrigger className="w-full border-amber-500/50 hover:bg-amber-500/10 focus:ring-amber-500">
                                <SelectValue placeholder="Válaszd ki az előfizetésed..." />
                            </SelectTrigger>
                            <SelectContent>
                                {subscriptions.map((sub) => (
                                    <SelectItem key={sub.id} value={sub.id}>
                                        {sub.name ||
                                            `Előfizetés #${sub.id.substring(0, 6)}`}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    ) : (
                        <div className="flex flex-col gap-2">
                            <div className="rounded-md border border-dashed bg-muted/20 p-2 text-center text-sm text-muted-foreground">
                                Nincs aktív, szabad előfizetésed.
                            </div>
                            <Button
                                variant="outline"
                                className="w-full text-amber-500 hover:bg-amber-500/10 hover:text-amber-600"
                                onClick={() =>
                                    window.open('/subscriptions', '_blank')
                                }
                            >
                                <ExternalLink className="mr-2 h-4 w-4" />{' '}
                                Prémium Vásárlása
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* 3. Jogosultságok Kezelése */}
            <div className="space-y-6">
                <div>
                    <Label className="text-base font-semibold text-foreground">
                        Jogosultságok kiosztása
                    </Label>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Válaszd ki, milyen módon szeretnéd kezelni a Discord
                        rangokat a rendszerben.
                    </p>
                </div>

                <Tabs
                    value={currentMode}
                    onValueChange={(val) =>
                        onChange('mode', val as 'preset' | 'custom')
                    }
                    className="w-full"
                >
                    <TabsList className="mb-6 grid w-full grid-cols-2">
                        <TabsTrigger value="preset">
                            Egyszerű (Alap Rangok)
                        </TabsTrigger>
                        <TabsTrigger value="custom">
                            Haladó (Részletes)
                        </TabsTrigger>
                    </TabsList>

                    <InputError
                        message={errors?.['settings.mode']}
                        className="mb-4"
                    />

                    {/* EGYSZERŰ MÓD (PRESET) */}
                    <TabsContent
                        value="preset"
                        className="space-y-6 rounded-xl border bg-card p-4"
                    >
                        <div className="grid gap-6 lg:grid-cols-3">
                            {/* User - Multiple Searchable */}
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-muted-foreground" />{' '}
                                    Alapértelmezett
                                </Label>
                                <Combobox
                                    multiple
                                    autoHighlight
                                    items={roleIds}
                                    value={presetRoles.user}
                                    onValueChange={(val) =>
                                        handlePresetChange(
                                            'user',
                                            val as string[],
                                        )
                                    }
                                >
                                    <ComboboxChips
                                        ref={presetUserAnchor}
                                        className={`w-full ${errors?.['settings.preset_roles.user'] ? 'border-destructive' : ''}`}
                                    >
                                        <ComboboxValue>
                                            {(values: string[]) => {
                                                const safeValues =
                                                    Array.isArray(values)
                                                        ? values
                                                        : [];

                                                return (
                                                    <React.Fragment>
                                                        {safeValues.map(
                                                            (val) => (
                                                                <ComboboxChip
                                                                    key={val}
                                                                >
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
                                                                        {getRoleName(
                                                                            val,
                                                                        )}
                                                                    </div>
                                                                </ComboboxChip>
                                                            ),
                                                        )}
                                                        <ComboboxChipsInput placeholder="Tag rangok..." />
                                                    </React.Fragment>
                                                );
                                            }}
                                        </ComboboxValue>
                                    </ComboboxChips>
                                    <ComboboxContent anchor={presetUserAnchor}>
                                        <ComboboxEmpty>
                                            Nincs találat.
                                        </ComboboxEmpty>
                                        <ComboboxList>
                                            {(item: string) => (
                                                <ComboboxItem
                                                    key={item}
                                                    value={item}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span
                                                            className="h-2 w-2 rounded-full"
                                                            style={{
                                                                backgroundColor:
                                                                    getRoleColor(
                                                                        item,
                                                                    ),
                                                            }}
                                                        />
                                                        {getRoleName(item)}
                                                    </div>
                                                </ComboboxItem>
                                            )}
                                        </ComboboxList>
                                    </ComboboxContent>
                                </Combobox>
                                <InputError
                                    message={
                                        errors?.['settings.preset_roles.user']
                                    }
                                />
                            </div>

                            {/* Staff - Multiple Searchable */}
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <ShieldAlert className="h-4 w-4 text-blue-500" />{' '}
                                    Moderátor
                                </Label>
                                <Combobox
                                    multiple
                                    autoHighlight
                                    items={roleIds}
                                    value={presetRoles.staff}
                                    onValueChange={(val) =>
                                        handlePresetChange(
                                            'staff',
                                            val as string[],
                                        )
                                    }
                                >
                                    <ComboboxChips
                                        ref={presetStaffAnchor}
                                        className={`w-full ${errors?.['settings.preset_roles.staff'] ? 'border-destructive' : ''}`}
                                    >
                                        <ComboboxValue>
                                            {(values: string[]) => {
                                                const safeValues =
                                                    Array.isArray(values)
                                                        ? values
                                                        : [];

                                                return (
                                                    <React.Fragment>
                                                        {safeValues.map(
                                                            (val) => (
                                                                <ComboboxChip
                                                                    key={val}
                                                                >
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
                                                                        {getRoleName(
                                                                            val,
                                                                        )}
                                                                    </div>
                                                                </ComboboxChip>
                                                            ),
                                                        )}
                                                        <ComboboxChipsInput placeholder="Moderátor rangok..." />
                                                    </React.Fragment>
                                                );
                                            }}
                                        </ComboboxValue>
                                    </ComboboxChips>
                                    <ComboboxContent anchor={presetStaffAnchor}>
                                        <ComboboxEmpty>
                                            Nincs találat.
                                        </ComboboxEmpty>
                                        <ComboboxList>
                                            {(item: string) => (
                                                <ComboboxItem
                                                    key={item}
                                                    value={item}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span
                                                            className="h-2 w-2 rounded-full"
                                                            style={{
                                                                backgroundColor:
                                                                    getRoleColor(
                                                                        item,
                                                                    ),
                                                            }}
                                                        />
                                                        {getRoleName(item)}
                                                    </div>
                                                </ComboboxItem>
                                            )}
                                        </ComboboxList>
                                    </ComboboxContent>
                                </Combobox>
                                <InputError
                                    message={
                                        errors?.['settings.preset_roles.staff']
                                    }
                                />
                            </div>

                            {/* Owner - Multiple Searchable */}
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <Crown className="h-4 w-4 text-amber-500" />{' '}
                                    Tulajdonos
                                </Label>
                                <Combobox
                                    multiple
                                    autoHighlight
                                    items={roleIds}
                                    value={presetRoles.owner}
                                    onValueChange={(val) =>
                                        handlePresetChange(
                                            'owner',
                                            val as string[],
                                        )
                                    }
                                >
                                    <ComboboxChips
                                        ref={presetOwnerAnchor}
                                        className={`w-full ${errors?.['settings.preset_roles.owner'] ? 'border-destructive' : ''}`}
                                    >
                                        <ComboboxValue>
                                            {(values: string[]) => {
                                                const safeValues =
                                                    Array.isArray(values)
                                                        ? values
                                                        : [];

                                                return (
                                                    <React.Fragment>
                                                        {safeValues.map(
                                                            (val) => (
                                                                <ComboboxChip
                                                                    key={val}
                                                                >
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
                                                                        {getRoleName(
                                                                            val,
                                                                        )}
                                                                    </div>
                                                                </ComboboxChip>
                                                            ),
                                                        )}
                                                        <ComboboxChipsInput placeholder="Vezetőségi rangok..." />
                                                    </React.Fragment>
                                                );
                                            }}
                                        </ComboboxValue>
                                    </ComboboxChips>
                                    <ComboboxContent anchor={presetOwnerAnchor}>
                                        <ComboboxEmpty>
                                            Nincs találat.
                                        </ComboboxEmpty>
                                        <ComboboxList>
                                            {(item: string) => (
                                                <ComboboxItem
                                                    key={item}
                                                    value={item}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span
                                                            className="h-2 w-2 rounded-full"
                                                            style={{
                                                                backgroundColor:
                                                                    getRoleColor(
                                                                        item,
                                                                    ),
                                                            }}
                                                        />
                                                        {getRoleName(item)}
                                                    </div>
                                                </ComboboxItem>
                                            )}
                                        </ComboboxList>
                                    </ComboboxContent>
                                </Combobox>
                                <InputError
                                    message={
                                        errors?.['settings.preset_roles.owner']
                                    }
                                />
                            </div>
                        </div>
                        <p className="pt-2 text-center text-xs text-muted-foreground">
                            A rendszer automatikusan szétosztja a funkciókhoz
                            szükséges jogosultságokat a kategóriák alapján.
                        </p>
                    </TabsContent>

                    {/* HALADÓ MÓD (CUSTOM) */}
                    <TabsContent value="custom" className="space-y-6">
                        <div className="flex flex-col items-start gap-4 rounded-xl border border-dashed border-primary/30 bg-accent/30 p-4 lg:flex-row lg:items-end">
                            {/* Discord Role - Single Searchable */}
                            <div className="w-full space-y-2 lg:w-[300px]">
                                <Label className="text-xs text-muted-foreground">
                                    Discord Rang
                                </Label>
                                <Combobox
                                    items={roleIds}
                                    value={selectedRole}
                                    onValueChange={(val) =>
                                        setSelectedRole(val || '')
                                    } // JAVÍTVA: TS null hiba
                                >
                                    {selectedRole ? (
                                        <div className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className="h-2.5 w-2.5 rounded-full"
                                                    style={{
                                                        backgroundColor:
                                                            getRoleColor(
                                                                selectedRole,
                                                            ),
                                                    }}
                                                />
                                                <span className="truncate">
                                                    {getRoleName(selectedRole)}
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedRole(''); // Törlés
                                                }}
                                                className="text-muted-foreground hover:text-foreground focus:outline-none"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <ComboboxInput
                                            placeholder="Keresés rang alapján..."
                                            showClear
                                        />
                                    )}
                                    <ComboboxContent>
                                        <ComboboxEmpty>
                                            Nincs találat.
                                        </ComboboxEmpty>
                                        <ComboboxList>
                                            {(item: string) => (
                                                <ComboboxItem
                                                    key={item}
                                                    value={item}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span
                                                            className="h-2.5 w-2.5 rounded-full"
                                                            style={{
                                                                backgroundColor:
                                                                    getRoleColor(
                                                                        item,
                                                                    ),
                                                            }}
                                                        />
                                                        {getRoleName(item)}
                                                    </div>
                                                </ComboboxItem>
                                            )}
                                        </ComboboxList>
                                    </ComboboxContent>
                                </Combobox>
                            </div>

                            {/* Permissions - Multiple Searchable */}
                            <div className="w-full flex-1 space-y-2">
                                <Label className="text-xs text-muted-foreground">
                                    Rendszer Jogosultság(ok)
                                </Label>
                                <Combobox
                                    multiple
                                    autoHighlight
                                    items={permValues}
                                    value={selectedPerms}
                                    onValueChange={(val) =>
                                        setSelectedPerms(val as string[])
                                    }
                                >
                                    <ComboboxChips
                                        ref={customPermAnchor}
                                        className="w-full"
                                    >
                                        <ComboboxValue>
                                            {(values: string[]) => {
                                                const safeValues =
                                                    Array.isArray(values)
                                                        ? values
                                                        : [];

                                                return (
                                                    <React.Fragment>
                                                        {safeValues.map(
                                                            (val) => (
                                                                <ComboboxChip
                                                                    key={val}
                                                                >
                                                                    {getPermName(
                                                                        val,
                                                                    )}
                                                                </ComboboxChip>
                                                            ),
                                                        )}
                                                        <ComboboxChipsInput placeholder="Válassz jogosultságot..." />
                                                    </React.Fragment>
                                                );
                                            }}
                                        </ComboboxValue>
                                    </ComboboxChips>
                                    <ComboboxContent anchor={customPermAnchor}>
                                        <ComboboxEmpty>
                                            Nincs találat.
                                        </ComboboxEmpty>
                                        <ComboboxList>
                                            {(item: string) => (
                                                <ComboboxItem
                                                    key={item}
                                                    value={item}
                                                >
                                                    {getPermName(item)}
                                                </ComboboxItem>
                                            )}
                                        </ComboboxList>
                                    </ComboboxContent>
                                </Combobox>
                            </div>

                            <Button
                                type="button"
                                onClick={handleAddRolePerm}
                                disabled={
                                    !selectedRole || selectedPerms.length === 0
                                }
                                variant="secondary"
                                className="w-full lg:w-auto"
                            >
                                <Plus className="mr-1.5 h-4 w-4" /> Hozzáadás
                            </Button>
                        </div>

                        <InputError
                            message={errors?.['settings.role_permissions']}
                        />

                        <div className="mt-8 space-y-4">
                            {Object.keys(groupedPermissions).length === 0 ? (
                                <div className="py-4 text-sm text-muted-foreground italic">
                                    Nincsenek még hozzárendelt jogosultságok.
                                </div>
                            ) : (
                                Object.entries(groupedPermissions).map(
                                    ([roleId, perms]) => (
                                        <div
                                            key={roleId}
                                            className="flex flex-col gap-3 rounded-xl border-2 border-dotted border-border/60 bg-muted/10 p-4"
                                        >
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className="h-3 w-3 rounded-full shadow-sm"
                                                    style={{
                                                        backgroundColor:
                                                            getRoleColor(
                                                                roleId,
                                                            ),
                                                    }}
                                                />
                                                <span className="font-semibold text-foreground">
                                                    {getRoleName(roleId)}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-2 pl-5">
                                                {perms.map((perm) => (
                                                    <Badge
                                                        key={`${roleId}-${perm}`}
                                                        variant="secondary"
                                                        className="flex items-center gap-1.5 border bg-background px-2.5 py-1 shadow-sm"
                                                    >
                                                        <span>
                                                            {getPermName(perm)}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleRemoveRolePerm(
                                                                    roleId,
                                                                    perm,
                                                                )
                                                            }
                                                            className="ml-1 rounded-full p-0.5 opacity-70 hover:bg-destructive/10 hover:text-destructive hover:opacity-100"
                                                        >
                                                            <X className="h-3.5 w-3.5" />
                                                        </button>
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    ),
                                )
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
