import React from 'react';
import InputError from '@/components/input-error';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type { FeatureViewProps } from '@/types';

export default function DutyManagerView({
    data,
    context_data,
    errors,
    onChange,
}: FeatureViewProps) {
    const channels = context_data.channels || [];

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="log_channel_id">Logolási Csatorna</Label>
                <Select
                    value={data.log_channel_id || ''}
                    onValueChange={(val) => onChange('log_channel_id', val)}
                >
                    <SelectTrigger
                        id="log_channel_id"
                        className={
                            errors.log_channel_id ? 'border-destructive' : ''
                        }
                    >
                        <SelectValue placeholder="Válassz csatornát..." />
                    </SelectTrigger>
                    <SelectContent>
                        {channels.map((channel: any) => (
                            <SelectItem key={channel.id} value={channel.id}>
                                #{channel.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {/* Megjelenítjük a konkrét hibát a mező alatt */}
                <InputError message={errors.log_channel_id} />
            </div>

            <div className="space-y-2">
                <div className="flex items-center space-x-2">
                    <Switch
                        id="require_reason"
                        checked={data.require_reason || false}
                        onCheckedChange={(val) =>
                            onChange('require_reason', val)
                        }
                    />
                    <Label htmlFor="require_reason">
                        Indoklás kötelező kilépéskor
                    </Label>
                </div>
                <InputError message={errors.require_reason} />
            </div>
        </div>
    );
}
