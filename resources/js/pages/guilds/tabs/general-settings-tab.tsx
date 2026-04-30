import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import InputError from '@/components/input-error';

interface GeneralSettingsTabProps {
    settings: any;
    on_change: (key: string, value: any) => void;
    errors: Record<string, string>;
}

export default function GeneralSettingsTab({ settings, on_change, errors }: GeneralSettingsTabProps) {
    return (
        <div className="space-y-6 bg-card p-6 rounded-lg border">
            <div>
                <h2 className="text-lg font-medium">Általános Beállítások</h2>
                <p className="text-sm text-muted-foreground">A szerver alapvető konfigurációja.</p>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="lang">Nyelv</Label>
                    <Select
                        value={settings?.lang || 'hu'}
                        onValueChange={(value) => on_change('lang', value)}
                    >
                        <SelectTrigger id="lang">
                            <SelectValue placeholder="Válassz nyelvet" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="hu">Magyar</SelectItem>
                            <SelectItem value="en">English</SelectItem>
                        </SelectContent>
                    </Select>
                    <InputError message={errors['settings.general.lang']} />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="mode">Működési Mód</Label>
                    <Select
                        value={settings?.mode || 'preset'}
                        onValueChange={(value) => on_change('mode', value)}
                    >
                        <SelectTrigger id="mode">
                            <SelectValue placeholder="Válassz módot" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="preset">Egyszerű (Preset)</SelectItem>
                            <SelectItem value="custom">Haladó (Custom)</SelectItem>
                        </SelectContent>
                    </Select>
                    <InputError message={errors['settings.general.mode']} />
                </div>

                {/* Itt folytatható a preset_roles és role_permissions bekérése a mode függvényében */}
            </div>
        </div>
    );
}
