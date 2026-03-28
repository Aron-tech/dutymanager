import { Info, Plus, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export interface GeneralSettingsData {
    lang?: string;
    mode?: 'preset' | 'custom';
    preset_roles?: {
        user?: string;
        staff?: string;
        owner?: string;
    };
    role_permissions?: Record<string, string[]>;
}

interface GeneralSettingsProps {
    data: GeneralSettingsData;
    context_data: {
        languages: { value: string; label: string }[];
        permissions: { value: string; label: string }[];
        discord_roles: { id: string; name: string; color: number }[];
    };
    errors: Record<string, string>;
    onChange: (field: string, value: any) => void;
}

export default function GeneralSettings({
    data,
    context_data,
    errors,
    onChange,
}: GeneralSettingsProps) {
    const rolePermissions = data.role_permissions || {};
    const presetRoles = data.preset_roles || {};
    const mode = data.mode || 'preset';

    // Alapértelmezett mód beállítása, ha még nincs
    useEffect(() => {
        if (!data.mode) {
            onChange('mode', 'preset');
        }
    }, [data.mode, onChange]);

    const [selectedRole, setSelectedRole] = useState<string>('');
    const [selectedPermission, setSelectedPermission] = useState<string>('');

    const availablePermissions = context_data.permissions.filter(
        (perm) =>
            !selectedRole ||
            !(rolePermissions[selectedRole] || []).includes(perm.value),
    );

    const handleAddPermission = () => {
        if (!selectedRole || !selectedPermission) {
            return;
        }

        const currentRolePerms = rolePermissions[selectedRole] || [];

        onChange('role_permissions', {
            ...rolePermissions,
            [selectedRole]: [...currentRolePerms, selectedPermission],
        });

        setSelectedPermission('');
    };

    const handleRemovePermission = (roleId: string, permValue: string) => {
        const currentRolePerms = rolePermissions[roleId] || [];
        const updatedPerms = currentRolePerms.filter((p) => p !== permValue);
        const newRolePermissions = { ...rolePermissions };

        if (updatedPerms.length === 0) {
            delete newRolePermissions[roleId];
        } else {
            newRolePermissions[roleId] = updatedPerms;
        }

        onChange('role_permissions', newRolePermissions);
    };

    const handlePresetChange = (
        type: 'user' | 'staff' | 'owner',
        roleId: string,
    ) => {
        onChange('preset_roles', { ...presetRoles, [type]: roleId });
    };

    return (
        <div className="space-y-8">
            {/* 1. Nyelvválasztó */}
            <div className="space-y-2">
                <Label htmlFor="lang">Alapértelmezett Nyelv</Label>
                <Select
                    value={data.lang || ''}
                    onValueChange={(val) => onChange('lang', val)}
                >
                    <SelectTrigger
                        id="lang"
                        className={`w-full max-w-sm ${errors['settings.lang'] ? 'border-destructive' : ''}`}
                    >
                        <SelectValue placeholder="Válassz nyelvet..." />
                    </SelectTrigger>
                    <SelectContent>
                        {context_data.languages.map((lang) => (
                            <SelectItem key={lang.value} value={lang.value}>
                                {lang.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <InputError message={errors['settings.lang']} />
            </div>

            <hr className="border-border" />

            {/* 2. Jogosultságok kezelése módokkal */}
            <div className="space-y-4">
                <div>
                    <h4 className="text-base font-semibold text-foreground">
                        Jogosultságok kezelése
                    </h4>
                    <p className="mb-4 text-sm text-muted-foreground">
                        Rendelj bot jogosultságokat a Discord szervereden lévő
                        rangokhoz. Válaszd ki a számodra megfelelő beállítási
                        módot.
                    </p>
                </div>

                <Tabs
                    value={mode}
                    onValueChange={(val) => onChange('mode', val)}
                    className="w-full"
                >
                    <TabsList className="grid w-full max-w-md grid-cols-2">
                        <TabsTrigger value="preset">
                            Előre beállított
                        </TabsTrigger>
                        <TabsTrigger value="custom">
                            Egyedi konfiguráció
                        </TabsTrigger>
                    </TabsList>

                    {/* --- PRESET MÓD --- */}
                    <TabsContent value="preset" className="mt-6 space-y-6">
                        <div className="flex items-start gap-3 rounded-md bg-muted p-4 text-sm text-muted-foreground">
                            <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                            <p>
                                Ebben a módban 3 alapvető szintet állítasz be. A
                                bot automatikusan legenerálja és hozzárendeli a
                                szükséges jogosultságokat a háttérben az
                                optimális működéshez.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                            {[
                                {
                                    id: 'user',
                                    label: 'Felhasználó (User)',
                                    desc: 'Alapvető parancsok, státuszok megtekintése.',
                                },
                                {
                                    id: 'staff',
                                    label: 'Személyzet (Staff)',
                                    desc: 'Moderáció, szolgálat megkezdése.',
                                },
                                {
                                    id: 'owner',
                                    label: 'Tulajdonos (Owner)',
                                    desc: 'Teljes hozzáférés a bot minden funkciójához.',
                                },
                            ].map((preset) => (
                                <div key={preset.id} className="space-y-2">
                                    <Label className="text-base font-medium">
                                        {preset.label}
                                    </Label>
                                    <p className="mb-2 min-h-[32px] text-xs text-muted-foreground">
                                        {preset.desc}
                                    </p>
                                    <Select
                                        value={
                                            presetRoles[
                                                preset.id as keyof typeof presetRoles
                                            ] || ''
                                        }
                                        onValueChange={(val) =>
                                            handlePresetChange(
                                                preset.id as any,
                                                val,
                                            )
                                        }
                                    >
                                        <SelectTrigger
                                            className={
                                                errors[
                                                    `settings.preset_roles.${preset.id}`
                                                ]
                                                    ? 'border-destructive'
                                                    : ''
                                            }
                                        >
                                            <SelectValue placeholder="Válassz rangot..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {context_data.discord_roles.map(
                                                (role) => (
                                                    <SelectItem
                                                        key={role.id}
                                                        value={role.id}
                                                    >
                                                        {role.name}
                                                    </SelectItem>
                                                ),
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <InputError
                                        message={
                                            errors[
                                                `settings.preset_roles.${preset.id}`
                                            ]
                                        }
                                    />
                                </div>
                            ))}
                        </div>
                    </TabsContent>

                    {/* --- CUSTOM MÓD --- */}
                    <TabsContent value="custom" className="mt-6">
                        <div className="flex flex-col items-end gap-3 sm:flex-row">
                            <div className="flex-1 space-y-2">
                                <Label>Discord Rang</Label>
                                <Select
                                    value={selectedRole}
                                    onValueChange={setSelectedRole}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Válassz rangot..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {context_data.discord_roles.map(
                                            (role) => (
                                                <SelectItem
                                                    key={role.id}
                                                    value={role.id}
                                                >
                                                    {role.name}
                                                </SelectItem>
                                            ),
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex-1 space-y-2">
                                <Label>Jogosultság</Label>
                                <Select
                                    value={selectedPermission}
                                    onValueChange={setSelectedPermission}
                                    disabled={
                                        !selectedRole ||
                                        availablePermissions.length === 0
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue
                                            placeholder={
                                                !selectedRole
                                                    ? 'Előbb válassz rangot...'
                                                    : availablePermissions.length ===
                                                        0
                                                      ? 'Minden jog kiadva'
                                                      : 'Válassz jogosultságot...'
                                            }
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availablePermissions.map((perm) => (
                                            <SelectItem
                                                key={perm.value}
                                                value={perm.value}
                                            >
                                                {perm.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <Button
                                type="button"
                                onClick={handleAddPermission}
                                disabled={!selectedRole || !selectedPermission}
                                className="mb-[2px]"
                            >
                                <Plus className="h-5 w-5" />
                            </Button>
                        </div>

                        <InputError
                            message={errors['settings.role_permissions']}
                        />

                        <div className="mt-6 space-y-4">
                            {Object.entries(rolePermissions).map(
                                ([roleId, perms]) => {
                                    const role =
                                        context_data.discord_roles.find(
                                            (r) => r.id === roleId,
                                        );

                                    if (!role || perms.length === 0) {
                                        return null;
                                    }

                                    return (
                                        <div
                                            key={roleId}
                                            className="rounded-xl border bg-card/50 p-4"
                                        >
                                            <h5 className="mb-3 flex items-center gap-2 text-sm font-medium">
                                                <span
                                                    className="h-3 w-3 rounded-full"
                                                    style={{
                                                        backgroundColor:
                                                            role.color
                                                                ? `#${role.color.toString(16).padStart(6, '0')}`
                                                                : '#99aab5',
                                                    }}
                                                ></span>
                                                {role.name}
                                            </h5>
                                            <div className="flex flex-wrap gap-2">
                                                {perms.map((permValue) => {
                                                    const permLabel =
                                                        context_data.permissions.find(
                                                            (p) =>
                                                                p.value ===
                                                                permValue,
                                                        )?.label || permValue;

                                                    return (
                                                        <Badge
                                                            key={permValue}
                                                            variant="secondary"
                                                            className="flex items-center gap-1.5 py-1 pr-1 pl-3"
                                                        >
                                                            {permLabel}
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleRemovePermission(
                                                                        roleId,
                                                                        permValue,
                                                                    )
                                                                }
                                                                className="rounded-full p-0.5 transition-colors hover:bg-destructive hover:text-destructive-foreground"
                                                            >
                                                                <X className="h-3 w-3" />
                                                            </button>
                                                        </Badge>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                },
                            )}

                            {Object.keys(rolePermissions).length === 0 && (
                                <div className="rounded-xl border-2 border-dashed py-6 text-center text-sm text-muted-foreground">
                                    Még nincsenek egyedi jogosultságok kiosztva.
                                    Válassz egy rangot és rendelj hozzá jogokat.
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
