import { Plus, X } from 'lucide-react';
import React, { useState } from 'react';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface GeneralSettingsProps {
    data: {
        lang?: string;
        role_permissions?: Record<string, string[]>;
    };
    context_data: {
        languages: { value: string; label: string }[];
        permissions: { value: string; label: string }[];
        discord_roles: { id: string; name: string; color: number }[];
    };
    errors: Record<string, string>;
    onChange: (field: string, value: any) => void;
}

export default function GeneralSettings({ data, context_data, errors, onChange }: GeneralSettingsProps) {
    const rolePermissions = data.role_permissions || {};

    const [selectedRole, setSelectedRole] = useState<string>('');
    const [selectedPermission, setSelectedPermission] = useState<string>('');

    const availablePermissions = context_data.permissions.filter(
        (perm) => !selectedRole || !(rolePermissions[selectedRole] || []).includes(perm.value)
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

    return (
        <div className="space-y-8">
            {/* 1. Nyelvválasztó */}
            <div className="space-y-2">
                <Label htmlFor="lang">Alapértelmezett Nyelv</Label>
                <Select
                    value={data.lang || ''}
                    onValueChange={(val) => onChange('lang', val)}
                >
                    <SelectTrigger id="lang" className={`w-full max-w-sm ${errors.lang ? 'border-destructive' : ''}`}>
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
                <InputError message={errors.lang} />
            </div>

            <hr className="border-border" />

            <div className="space-y-4">
                <div>
                    <h4 className="text-base font-semibold text-foreground">Jogosultságok kezelése</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                        Rendelj bot jogosultságokat a Discord szervereden lévő rangokhoz.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 items-end">
                    <div className="space-y-2 flex-1">
                        <Label>Discord Rang</Label>
                        <Select value={selectedRole} onValueChange={setSelectedRole}>
                            <SelectTrigger>
                                <SelectValue placeholder="Válassz rangot..." />
                            </SelectTrigger>
                            <SelectContent>
                                {context_data.discord_roles.map((role) => (
                                    <SelectItem key={role.id} value={role.id}>
                                        {role.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2 flex-1">
                        <Label>Jogosultság</Label>
                        <Select
                            value={selectedPermission}
                            onValueChange={setSelectedPermission}
                            disabled={!selectedRole || availablePermissions.length === 0}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={
                                    !selectedRole ? 'Előbb válassz rangot...' :
                                        availablePermissions.length === 0 ? 'Minden jog kiadva' : 'Válassz jogosultságot...'
                                } />
                            </SelectTrigger>
                            <SelectContent>
                                {availablePermissions.map((perm) => (
                                    <SelectItem key={perm.value} value={perm.value}>
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
                        <Plus className="w-5 h-5" />
                    </Button>
                </div>
                <InputError message={errors.role_permissions} />

                <div className="mt-6 space-y-4">
                    {Object.entries(rolePermissions).map(([roleId, perms]) => {
                        const role = context_data.discord_roles.find((r) => r.id === roleId);

                        if (!role || perms.length === 0) {
                            return null;
                        }

                        return (
                            <div key={roleId} className="p-4 rounded-xl border bg-card/50">
                                <h5 className="font-medium text-sm mb-3 flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: role.color ? `#${role.color.toString(16).padStart(6, '0')}` : '#99aab5' }}></span>
                                    {role.name}
                                </h5>
                                <div className="flex flex-wrap gap-2">
                                    {perms.map((permValue) => {
                                        const permLabel = context_data.permissions.find(p => p.value === permValue)?.label || permValue;

                                        return (
                                            <Badge key={permValue} variant="secondary" className="pl-3 pr-1 py-1 flex items-center gap-1.5">
                                                {permLabel}
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemovePermission(roleId, permValue)}
                                                    className="rounded-full p-0.5 hover:bg-destructive hover:text-destructive-foreground transition-colors"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </Badge>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}

                    {Object.keys(rolePermissions).length === 0 && (
                        <div className="text-center py-6 text-sm text-muted-foreground border-2 border-dashed rounded-xl">
                            Még nincsenek egyedi jogosultságok kiosztva.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
