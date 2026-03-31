import { Plus, X } from 'lucide-react';
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface GeneralSettingsProps {
    data: {
        language?: string;
        role_permissions?: { role_id: string; permission: string }[];
    };
    context_data: {
        languages: { value: string; label: string }[];
        permissions: { value: string; label: string }[];
        discord_roles: { id: string; name: string; color?: number | string }[]; // Szín hozzáadva
    };
    onChange: (field: string, value: any) => void;
    errors?: Record<string, string>;
}

export default function GeneralSettings({ data, context_data, onChange, errors }: GeneralSettingsProps) {
    const [selectedRole, setSelectedRole] = useState<string>('');
    const [selectedPerm, setSelectedPerm] = useState<string>('');

    const rolePermissions = data.role_permissions || [];

    const handleAddRolePerm = () => {
        if (!selectedRole || !selectedPerm) return;

        const exists = rolePermissions.some(
            (rp) => rp.role_id === selectedRole && rp.permission === selectedPerm
        );

        if (!exists) {
            onChange('role_permissions', [
                ...rolePermissions,
                { role_id: selectedRole, permission: selectedPerm }
            ]);
        }

        setSelectedRole('');
        setSelectedPerm('');
    };

    const handleRemoveRolePerm = (roleId: string, perm: string) => {
        const updated = rolePermissions.filter(
            (rp) => !(rp.role_id === roleId && rp.permission === perm)
        );
        onChange('role_permissions', updated);
    };

    // --- Segédfüggvények ---

    // Rang nevének kinyerése
    const getRoleName = (id: string) =>
        context_data.discord_roles?.find(r => r.id === id)?.name || id;

    // Jogosultság nevének kinyerése
    const getPermName = (val: string) =>
        context_data.permissions?.find(p => p.value === val)?.label || val;

    // Discord szín konvertálása (A Discord gyakran integerként küldi a színt)
    const getRoleColor = (id: string) => {
        const role = context_data.discord_roles?.find(r => r.id === id);
        if (!role || !role.color) return '#99aab5'; // Alapértelmezett Discord szürke, ha nincs szín

        if (typeof role.color === 'number') {
            // Integer átalakítása HEX formátummá
            return `#${role.color.toString(16).padStart(6, '0')}`;
        }
        return role.color;
    };

    // Jogosultságok csoportosítása Role ID alapján a megjelenítéshez
    const groupedPermissions = rolePermissions.reduce((acc, curr) => {
        if (!acc[curr.role_id]) {
            acc[curr.role_id] = [];
        }
        acc[curr.role_id].push(curr.permission);
        return acc;
    }, {} as Record<string, string[]>);

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">

            {/* 1. Nyelv kiválasztása (Lapos dizájn) */}
            <div className="space-y-3">
                <Label className="text-base font-semibold text-foreground">Szerver alapértelmezett nyelve</Label>
                <Select
                    value={data.language || ''}
                    onValueChange={(val) => onChange('language', val)}
                >
                    <SelectTrigger className="w-full md:w-[300px]">
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
                {errors?.['settings.language'] && (
                    <p className="text-sm font-medium text-destructive">
                        {errors['settings.language']}
                    </p>
                )}
            </div>

            {/* 2. Discord Rang - Jogosultság hozzárendelés */}
            <div className="space-y-6">
                <div>
                    <Label className="text-base font-semibold text-foreground">Jogosultságok kiosztása</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                        Rendelj rendszer jogosultságokat a Discord szervereden található rangokhoz.
                    </p>
                </div>

                {/* Hozzáadó form */}
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="space-y-2 flex-1 max-w-[300px]">
                        <Label className="text-xs text-muted-foreground">Discord Rang</Label>
                        <Select value={selectedRole} onValueChange={setSelectedRole}>
                            <SelectTrigger>
                                <SelectValue placeholder="Válassz rangot..." />
                            </SelectTrigger>
                            <SelectContent>
                                {context_data.discord_roles?.map((role) => (
                                    <SelectItem key={role.id} value={role.id}>
                                        <div className="flex items-center gap-2">
                                            <span
                                                className="w-2.5 h-2.5 rounded-full"
                                                style={{ backgroundColor: getRoleColor(role.id) }}
                                            />
                                            {role.name}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2 flex-1 max-w-[300px]">
                        <Label className="text-xs text-muted-foreground">Rendszer Jogosultság</Label>
                        <Select value={selectedPerm} onValueChange={setSelectedPerm}>
                            <SelectTrigger>
                                <SelectValue placeholder="Válassz jogosultságot..." />
                            </SelectTrigger>
                            <SelectContent>
                                {context_data.permissions?.map((perm) => (
                                    <SelectItem key={perm.value} value={perm.value}>
                                        {perm.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Button
                        type="button"
                        onClick={handleAddRolePerm}
                        disabled={!selectedRole || !selectedPerm}
                        className="w-full md:w-auto"
                        variant="secondary"
                    >
                        <Plus className="w-4 h-4 mr-1.5" /> Hozzáadás
                    </Button>
                </div>

                {errors?.['settings.role_permissions'] && (
                    <p className="text-sm font-medium text-destructive">
                        {errors['settings.role_permissions']}
                    </p>
                )}

                {/* Dotted Konténerek (Csoportosítva Rangonként) */}
                <div className="mt-8 space-y-4">
                    {Object.keys(groupedPermissions).length === 0 ? (
                        <div className="text-sm text-muted-foreground italic py-4">
                            Nincsenek még hozzárendelt jogosultságok.
                        </div>
                    ) : (
                        Object.entries(groupedPermissions).map(([roleId, perms]) => (
                            <div
                                key={roleId}
                                className="flex flex-col gap-3 p-4 border-2 border-dotted border-border/60 rounded-xl bg-muted/10"
                            >
                                {/* Rang fejléce színnel */}
                                <div className="flex items-center gap-2">
                                    <span
                                        className="w-3 h-3 rounded-full shadow-sm"
                                        style={{ backgroundColor: getRoleColor(roleId) }}
                                    />
                                    <span className="font-semibold text-foreground">
                                        {getRoleName(roleId)}
                                    </span>
                                </div>

                                {/* Ranghoz tartozó jogosultságok */}
                                <div className="flex flex-wrap gap-2 pl-5">
                                    {perms.map((perm) => (
                                        <Badge
                                            key={`${roleId}-${perm}`}
                                            variant="secondary"
                                            className="flex items-center gap-1.5 py-1 px-2.5 font-normal bg-background shadow-sm border"
                                        >
                                            <span>{getPermName(perm)}</span>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveRolePerm(roleId, perm)}
                                                className="ml-1 rounded-full p-0.5 opacity-70 hover:opacity-100 hover:bg-destructive/10 hover:text-destructive focus:outline-none transition-all"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>

            </div>
        </div>
    );
}
