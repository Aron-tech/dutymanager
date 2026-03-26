import { router } from '@inertiajs/react';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { feature_registry } from '@/features/config/features';

export default function GuildSettings({ guild, settings, context_data }: any) {
    const [feature_settings, setFeatureSettings] = useState<Record<string, any>>(settings.feature_settings || {});

    const handleFeatureDataChange = (feature_id: string, field_name: string, value: any) => {
        setFeatureSettings(prev => ({
            ...prev,
            [feature_id]: { ...prev[feature_id], [field_name]: value }
        }));
    };

    const handleSaveAll = () => {
        router.post(`/guilds/${guild.id}/settings`, { feature_settings });
    };

    return (
        <div className="max-w-4xl mx-auto py-10 space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Szerver Beállítások</h1>
                <Button onClick={handleSaveAll}>Minden mentése</Button>
            </div>

            {settings.features.map((feature_id: string) => {
                const feature = feature_registry[feature_id];
                const FeatureComponent = feature?.view;

                if (!FeatureComponent) {
                    return null;
                }

                return (
                    <Card key={feature_id}>
                        <CardHeader>
                            <CardTitle>{feature.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {/* Ugyanaz a komponens, mint a varázslóban! */}
                            <FeatureComponent
                                data={feature_settings[feature_id] || {}}
                                context_data={context_data}
                                onChange={(field, val) => handleFeatureDataChange(feature_id, field, val)}
                            />
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
