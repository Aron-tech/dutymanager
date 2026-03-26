import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type { FeatureViewProps } from '@/types';

export default function DutyManagerView({ data, context_data, onChange }: FeatureViewProps) {
    const channels = context_data.channels || [];

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Label>Logolási Csatorna</Label>
                <Select
                    value={data.log_channel_id || ''}
                    onValueChange={(val) => onChange('log_channel_id', val)}
                >
                    <SelectTrigger>
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
            </div>

            <div className="flex items-center space-x-2">
                <Switch
                    checked={data.require_reason || false}
                    onCheckedChange={(val) => onChange('require_reason', val)}
                />
                <Label>Indoklás kötelező kilépéskor</Label>
            </div>
        </div>
    );
}
