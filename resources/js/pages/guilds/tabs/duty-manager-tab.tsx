import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import InputError from '@/components/input-error';

interface DutyManagerTabProps {
    is_enabled: boolean;
    on_toggle: (enabled: boolean) => void;
    settings: any;
    on_change: (key: string, value: any) => void;
    errors: Record<string, string>;
}

export default function DutyManagerTab({ is_enabled, on_toggle, settings, on_change, errors }: DutyManagerTabProps) {
    return (
        <div className="space-y-8 bg-card p-6 rounded-lg border">
            <div className="flex items-center justify-between border-b pb-4">
                <div>
                    <h2 className="text-lg font-medium">Duty Manager Modul</h2>
                    <p className="text-sm text-muted-foreground">Szolgálatkezelő rendszer aktiválása és beállítása.</p>
                </div>
                <Switch
                    checked={is_enabled}
                    onCheckedChange={on_toggle}
                />
            </div>

            <div className={`space-y-4 ${!is_enabled ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="space-y-2">
                    <Label htmlFor="duty_role_id">Duty Rang ID</Label>
                    <Input
                        id="duty_role_id"
                        value={settings?.duty_role_id || ''}
                        onChange={(e) => on_change('duty_role_id', e.target.value)}
                        placeholder="Discord Role ID"
                    />
                    <InputError message={errors['settings.duty_manager.duty_role_id']} />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="duty_panel_channel_id">Duty Panel Csatorna ID</Label>
                    <Input
                        id="duty_panel_channel_id"
                        value={settings?.duty_panel_channel_id || ''}
                        onChange={(e) => on_change('duty_panel_channel_id', e.target.value)}
                        placeholder="Discord Channel ID"
                    />
                    <InputError message={errors['settings.duty_manager.duty_panel_channel_id']} />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="duty_log_channel_id">Duty Log Csatorna ID</Label>
                    <Input
                        id="duty_log_channel_id"
                        value={settings?.duty_log_channel_id || ''}
                        onChange={(e) => on_change('duty_log_channel_id', e.target.value)}
                        placeholder="Discord Channel ID"
                    />
                    <InputError message={errors['settings.duty_manager.duty_log_channel_id']} />
                </div>
            </div>
        </div>
    );
}
