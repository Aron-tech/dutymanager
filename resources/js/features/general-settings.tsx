import { router } from '@inertiajs/react';
import {
    Plus,
    X,
    User,
    ShieldAlert,
    Crown,
    Gem,
    CheckCircle2,
    Info,
} from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface GeneralSettingsProps {
    data: {
        lang?: string;
        default_role?: string;
        mode?: 'preset' | 'custom';
        preset_roles?: { user: any; staff: any; owner: any };
        role_permissions?: { role_id: string; permission: string }[];
    };
    context_data: {
        guild_id: string;
        license?: {
            is_active: boolean;
            plan_type?: string;
            expires_at?: string;
        };
        languages: { value: string; label: string }[];
        permissions: { value: string; label: string }[];
        discord_roles: { id: string; name: string; color?: number | string }[];
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

    const [licenseKey, setLicenseKey] = useState('');
    const [isActivating, setIsActivating] = useState(false);

    const presetUserAnchor = useComboboxAnchor();
    const presetStaffAnchor = useComboboxAnchor();
    const presetOwnerAnchor = useComboboxAnchor();
    const customPermAnchor = useComboboxAnchor();

    const rolePermissions = data.role_permissions || [];
    const currentMode = data.mode || 'preset';

    const rawPreset = data.preset_roles || {};
    const presetRoles = {
        user: Array.isArray(rawPreset.user) ? rawPreset.user : rawPreset.user ? [rawPreset.user] : [],
        staff: Array.isArray(rawPreset.staff) ? rawPreset.staff : rawPreset.staff ? [rawPreset.staff] : [],
        owner: Array.isArray(rawPreset.owner) ? rawPreset.owner : rawPreset.owner ? [rawPreset.owner] : [],
    };

    const roleIds = context_data.discord_roles?.map((r) => r.id) || [];
    const permValues = context_data.permissions?.map((p) => p.value) || [];

    const handleAddRolePerm = () => {
        if (!selectedRole || selectedPerms.length === 0) return;

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

    const handlePresetChange = (type: 'user' | 'staff' | 'owner', value: string[]) => {
        onChange('preset_roles', { ...presetRoles, [type]: value });
    };

    const activateLicense = () => {
        if (!licenseKey) return;

        setIsActivating(true);

        router.post(
            route('guild.license.activate', context_data.guild_id),
            { license_key: licenseKey },
            {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('License sikeresen aktiválva!');
                    setLicenseKey('');
                    setIsActivating(false);
                },
                onError: (err) => {
                    const errorMsg = err.license_key || 'Hiba történt az aktiválás során.';
                    toast.error(errorMsg);
                    setIsActivating(false);
                },
                onFinish: () => {
                    setIsActivating(false);
                }
            }
        );
    };

    const getRoleName = (id: string) => context_data.discord_roles?.find((r) => r.id === id)?.name || id;
    const getPermName = (val: string) => context_data.permissions?.find((p) => p.value === val)?.label || val;
    const getRoleColor = (id: string) => {
        const role = context_data.discord_roles?.find((r) => r.id === id);
        if (!role || !role.color) return '#99aab5';
        if (typeof role.color === 'number') return `#${role.color.toString(16).padStart(6, '0')}`;
        return role.color;
    };

    const groupedPermissions = rolePermissions.reduce(
        (acc, curr) => {
            if (!acc[curr.role_id]) acc[curr.role_id] = [];
            acc[curr.role_id].push(curr.permission);
            return acc;
        },
        {} as Record<string, string[]>,
    );

    return (
        <TooltipProvider delayDuration={300}>
            <div className="animate-in space-y-10 duration-500 fade-in slide-in-from-bottom-2">
                <div className="grid gap-8 border-b pb-8 md:grid-cols-2">
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <Label className="text-base font-semibold text-foreground">
                                Szerver alapértelmezett nyelve <span className="text-destructive">*</span>
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
                            <InputError message={errors?.['lang']} />
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Label className="text-base font-semibold text-foreground">
                                    Alapértelmezett rang <span className="text-destructive">*</span>
                                </Label>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Info className="h-4 w-4 cursor-pointer text-muted-foreground hover:text-primary transition-colors" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="max-w-[200px] text-sm">Felhasználó hozzáadásakor ezt a rangot fogja rátenni.</p>
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                            <Select
                                value={data.default_role || ''}
                                onValueChange={(val) => onChange('default_role', val)}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Válassz alapértelmezett rangot..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {context_data.discord_roles?.map((role) => (
                                        <SelectItem key={role.id} value={role.id}>
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className="h-2.5 w-2.5 rounded-full"
                                                    style={{ backgroundColor: getRoleColor(role.id) }}
                                                />
                                                {role.name}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={errors?.['default_role']} />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label className="flex items-center gap-2 text-base font-semibold text-amber-500">
                            <Gem className="h-4 w-4" /> Prémium License
                        </Label>

                        {context_data.license?.is_active ? (
                            <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
                                <div className="flex items-center gap-2 font-medium text-amber-600 mb-2 text-base">
                                    <CheckCircle2 className="h-5 w-5" /> Aktív Prémium
                                </div>
                                <div className="flex flex-col gap-1 text-muted-foreground">
                                    <p>Típus: <span className="font-semibold text-foreground">{context_data.license.plan_type === 'lifetime' ? 'Örökös (Lifetime)' : 'Éves (Yearly)'}</span></p>
                                    {context_data.license.plan_type === 'yearly' && context_data.license.expires_at && (
                                        <p>Lejár: <span className="font-semibold text-foreground">{new Date(context_data.license.expires_at).toLocaleDateString('hu-HU')}</span></p>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="XXXX-XXXX-XXXX-XXXX"
                                        value={licenseKey}
                                        onChange={(e) => setLicenseKey(e.target.value)}
                                        className="font-mono uppercase"
                                    />
                                    <Button
                                        type="button"
                                        onClick={activateLicense}
                                        disabled={!licenseKey || isActivating}
                                        className="shrink-0 bg-amber-500 hover:bg-amber-600 text-white"
                                    >
                                        {isActivating ? 'Aktiválás...' : 'Aktiválás'}
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Nincs aktív prémium a szerveren. Az aktiváláshoz adj meg egy érvényes license kulcsot.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

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
                            message={errors?.['mode']}
                            className="mb-4"
                        />

                        <TabsContent
                            value="preset"
                            className="space-y-6 rounded-xl border bg-card p-4"
                        >
                            <div className="grid gap-6 lg:grid-cols-3">
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
                                            handlePresetChange('user', val as string[])
                                        }
                                    >
                                        <ComboboxChips ref={presetUserAnchor} className={`w-full ${errors?.['preset_roles.user'] ? 'border-destructive' : ''}`}>
                                            <ComboboxValue>
                                                {(values: string[]) => {
                                                    const safeValues = Array.isArray(values) ? values : [];
                                                    return (
                                                        <React.Fragment>
                                                            {safeValues.map((val) => (
                                                                <ComboboxChip key={val}>
                                                                    <div className="flex items-center gap-1.5">
                                                                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: getRoleColor(val) }} />
                                                                        {getRoleName(val)}
                                                                    </div>
                                                                </ComboboxChip>
                                                            ))}
                                                            <ComboboxChipsInput placeholder="Tag rangok..." />
                                                        </React.Fragment>
                                                    );
                                                }}
                                            </ComboboxValue>
                                        </ComboboxChips>
                                        <ComboboxContent anchor={presetUserAnchor}>
                                            <ComboboxEmpty>Nincs találat.</ComboboxEmpty>
                                            <ComboboxList>
                                                {(item: string) => (
                                                    <ComboboxItem key={item} value={item}>
                                                        <div className="flex items-center gap-2">
                                                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: getRoleColor(item) }} />
                                                            {getRoleName(item)}
                                                        </div>
                                                    </ComboboxItem>
                                                )}
                                            </ComboboxList>
                                        </ComboboxContent>
                                    </Combobox>
                                    <InputError message={errors?.['preset_roles.user']} />
                                </div>

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
                                            handlePresetChange('staff', val as string[])
                                        }
                                    >
                                        <ComboboxChips ref={presetStaffAnchor} className={`w-full ${errors?.['preset_roles.staff'] ? 'border-destructive' : ''}`}>
                                            <ComboboxValue>
                                                {(values: string[]) => {
                                                    const safeValues = Array.isArray(values) ? values : [];
                                                    return (
                                                        <React.Fragment>
                                                            {safeValues.map((val) => (
                                                                <ComboboxChip key={val}>
                                                                    <div className="flex items-center gap-1.5">
                                                                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: getRoleColor(val) }} />
                                                                        {getRoleName(val)}
                                                                    </div>
                                                                </ComboboxChip>
                                                            ))}
                                                            <ComboboxChipsInput placeholder="Moderátor rangok..." />
                                                        </React.Fragment>
                                                    );
                                                }}
                                            </ComboboxValue>
                                        </ComboboxChips>
                                        <ComboboxContent anchor={presetStaffAnchor}>
                                            <ComboboxEmpty>Nincs találat.</ComboboxEmpty>
                                            <ComboboxList>
                                                {(item: string) => (
                                                    <ComboboxItem key={item} value={item}>
                                                        <div className="flex items-center gap-2">
                                                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: getRoleColor(item) }} />
                                                            {getRoleName(item)}
                                                        </div>
                                                    </ComboboxItem>
                                                )}
                                            </ComboboxList>
                                        </ComboboxContent>
                                    </Combobox>
                                    <InputError message={errors?.['preset_roles.staff']} />
                                </div>

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
                                            handlePresetChange('owner', val as string[])
                                        }
                                    >
                                        <ComboboxChips ref={presetOwnerAnchor} className={`w-full ${errors?.['preset_roles.owner'] ? 'border-destructive' : ''}`}>
                                            <ComboboxValue>
                                                {(values: string[]) => {
                                                    const safeValues = Array.isArray(values) ? values : [];
                                                    return (
                                                        <React.Fragment>
                                                            {safeValues.map((val) => (
                                                                <ComboboxChip key={val}>
                                                                    <div className="flex items-center gap-1.5">
                                                                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: getRoleColor(val) }} />
                                                                        {getRoleName(val)}
                                                                    </div>
                                                                </ComboboxChip>
                                                            ))}
                                                            <ComboboxChipsInput placeholder="Vezetőségi rangok..." />
                                                        </React.Fragment>
                                                    );
                                                }}
                                            </ComboboxValue>
                                        </ComboboxChips>
                                        <ComboboxContent anchor={presetOwnerAnchor}>
                                            <ComboboxEmpty>Nincs találat.</ComboboxEmpty>
                                            <ComboboxList>
                                                {(item: string) => (
                                                    <ComboboxItem key={item} value={item}>
                                                        <div className="flex items-center gap-2">
                                                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: getRoleColor(item) }} />
                                                            {getRoleName(item)}
                                                        </div>
                                                    </ComboboxItem>
                                                )}
                                            </ComboboxList>
                                        </ComboboxContent>
                                    </Combobox>
                                    <InputError message={errors?.['preset_roles.owner']} />
                                </div>
                            </div>
                            <p className="pt-2 text-center text-xs text-muted-foreground">
                                A rendszer automatikusan szétosztja a funkciókhoz szükséges jogosultságokat a kategóriák alapján.
                            </p>
                        </TabsContent>

                        <TabsContent value="custom" className="space-y-6">
                            <div className="flex flex-col items-start gap-4 rounded-xl border border-dashed border-primary/30 bg-accent/30 p-4 lg:flex-row lg:items-end">
                                <div className="w-full space-y-2 lg:w-[300px]">
                                    <Label className="text-xs text-muted-foreground">Discord Rang</Label>
                                    <Combobox items={roleIds} value={selectedRole} onValueChange={(val) => setSelectedRole(val || '')}>
                                        {selectedRole ? (
                                            <div className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
                                                <div className="flex items-center gap-2">
                                                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: getRoleColor(selectedRole) }} />
                                                    <span className="truncate">{getRoleName(selectedRole)}</span>
                                                </div>
                                                <button type="button" onClick={(e) => { e.stopPropagation(); setSelectedRole(''); }} className="text-muted-foreground hover:text-foreground focus:outline-none">
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <ComboboxInput placeholder="Keresés rang alapján..." showClear />
                                        )}
                                        <ComboboxContent>
                                            <ComboboxEmpty>Nincs találat.</ComboboxEmpty>
                                            <ComboboxList>
                                                {(item: string) => (
                                                    <ComboboxItem key={item} value={item}>
                                                        <div className="flex items-center gap-2">
                                                            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: getRoleColor(item) }} />
                                                            {getRoleName(item)}
                                                        </div>
                                                    </ComboboxItem>
                                                )}
                                            </ComboboxList>
                                        </ComboboxContent>
                                    </Combobox>
                                </div>

                                <div className="w-full flex-1 space-y-2">
                                    <Label className="text-xs text-muted-foreground">Rendszer Jogosultság(ok)</Label>
                                    <Combobox multiple autoHighlight items={permValues} value={selectedPerms} onValueChange={(val) => setSelectedPerms(val as string[])}>
                                        <ComboboxChips ref={customPermAnchor} className="w-full">
                                            <ComboboxValue>
                                                {(values: string[]) => {
                                                    const safeValues = Array.isArray(values) ? values : [];
                                                    return (
                                                        <React.Fragment>
                                                            {safeValues.map((val) => (
                                                                <ComboboxChip key={val}>{getPermName(val)}</ComboboxChip>
                                                            ))}
                                                            <ComboboxChipsInput placeholder="Válassz jogosultságot..." />
                                                        </React.Fragment>
                                                    );
                                                }}
                                            </ComboboxValue>
                                        </ComboboxChips>
                                        <ComboboxContent anchor={customPermAnchor}>
                                            <ComboboxEmpty>Nincs találat.</ComboboxEmpty>
                                            <ComboboxList>
                                                {(item: string) => (
                                                    <ComboboxItem key={item} value={item}>{getPermName(item)}</ComboboxItem>
                                                )}
                                            </ComboboxList>
                                        </ComboboxContent>
                                    </Combobox>
                                </div>

                                <Button type="button" onClick={handleAddRolePerm} disabled={!selectedRole || selectedPerms.length === 0} variant="secondary" className="w-full lg:w-auto">
                                    <Plus className="mr-1.5 h-4 w-4" /> Hozzáadás
                                </Button>
                            </div>

                            <InputError message={errors?.['role_permissions']} />

                            <div className="mt-8 space-y-4">
                                {Object.keys(groupedPermissions).length === 0 ? (
                                    <div className="py-4 text-sm text-muted-foreground italic">
                                        Nincsenek még hozzárendelt jogosultságok.
                                    </div>
                                ) : (
                                    Object.entries(groupedPermissions).map(([roleId, perms]) => (
                                        <div key={roleId} className="flex flex-col gap-3 rounded-xl border-2 border-dotted border-border/60 bg-muted/10 p-4">
                                            <div className="flex items-center gap-2">
                                                <span className="h-3 w-3 rounded-full shadow-sm" style={{ backgroundColor: getRoleColor(roleId) }} />
                                                <span className="font-semibold text-foreground">{getRoleName(roleId)}</span>
                                            </div>
                                            <div className="flex flex-wrap gap-2 pl-5">
                                                {perms.map((perm) => (
                                                    <Badge key={`${roleId}-${perm}`} variant="secondary" className="flex items-center gap-1.5 border bg-background px-2.5 py-1 shadow-sm">
                                                        <span>{getPermName(perm)}</span>
                                                        <button type="button" onClick={() => handleRemoveRolePerm(roleId, perm)} className="ml-1 rounded-full p-0.5 opacity-70 hover:bg-destructive/10 hover:text-destructive hover:opacity-100">
                                                            <X className="h-3.5 w-3.5" />
                                                        </button>
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </TooltipProvider>
    );
}
