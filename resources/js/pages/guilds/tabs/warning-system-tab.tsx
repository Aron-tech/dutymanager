import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import InputError from '@/components/input-error';

interface WarningSystemTabProps {
    is_enabled: boolean;
    on_toggle: (enabled: boolean) => void;
    settings: any;
    on_change: (key: string, value: any) => void;
    errors: Record<string, string>;
}

export default function WarningSystemTab({ is_enabled, on_toggle, settings, on_change, errors }: WarningSystemTabProps) {
    return (
        <div className="space-y-8 bg-card p-6 rounded-lg border">
            <div className="flex items-center justify-between border-b pb-4">
                <div>
                    <h2 className="text-lg font-medium">Warning System Modul</h2>
                    <p className="text-sm text-muted-foreground">Figyelmeztetési rendszer aktiválása.</p>
                </div>
                <Switch
                    checked={is_enabled}
                    onCheckedChange={on_toggle}
                />
            </div>

            <div className={`space-y-4 ${!is_enabled ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="space-y-2">
                    <Label htmlFor="warning_channel_id">Warning Csatorna ID</Label>
                    <Input
                        id="warning_channel_id"
                        value={settings?.warning_channel_id || ''}
                        onChange={(e) => on_change('warning_channel_id', e.target.value)}
                        placeholder="Discord Channel ID"
                    />
                    <InputError message={errors['settings.warning_system.warning_channel_id']} />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="auto_expire_days">Automatikus elévülés (nap)</Label>
                    <Input
                        id="auto_expire_days"
                        type="number"
                        min="1"
                        value={settings?.auto_expire_days || ''}
                        onChange={(e) => on_change('auto_expire_days', parseInt(e.target.value))}
                        placeholder="Pl.: 30"
                    />
                    <InputError message={errors['settings.warning_system.auto_expire_days']} />
                </div>
            </div>
        </div>
    );
}
