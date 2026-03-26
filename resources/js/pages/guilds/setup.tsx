// resources/js/pages/guilds/setup.tsx
import { router } from '@inertiajs/react';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { feature_registry } from '@/features/config/features';
import type { Guild, GuildSettings } from '@/types';

interface SetupProps {
    guild: Guild;
    settings: GuildSettings;
    context_data: Record<string, any>;
}

export default function Setup({ guild, settings, context_data }: SetupProps) {
    const [current_step, setCurrentStep] = useState<number>(
        settings.current_step || 0,
    );
    const [selected_features, setSelectedFeatures] = useState<string[]>(
        settings.features || [],
    );
    const [feature_settings, setFeatureSettings] = useState<
        Record<string, any>
    >(settings.feature_settings || {});

    // Lépés 0: Funkcióválasztó nézet
    if (current_step === 0) {
        return (
            <div className="mx-auto max-w-2xl py-10">
                <h2 className="mb-4 text-2xl font-bold">
                    Válaszd ki a modulokat
                </h2>
                <div className="space-y-4">
                    {Object.values(feature_registry).map((feature) => (
                        <div
                            key={feature.id}
                            className="flex items-center space-x-2"
                        >
                            <Checkbox
                                checked={selected_features.includes(feature.id)}
                                onCheckedChange={(checked) => {
                                    if (checked) {
                                        setSelectedFeatures([
                                            ...selected_features,
                                            feature.id,
                                        ]);
                                    } else {
                                        setSelectedFeatures(
                                            selected_features.filter(
                                                (id) => id !== feature.id,
                                            ),
                                        );
                                    }
                                }}
                            />
                            <label>{feature.title}</label>
                        </div>
                    ))}
                </div>
                <Button
                    className="mt-6"
                    onClick={() => {
                        router.post(
                            `/guilds/${guild.id}/setup/features`,
                            {
                                next_step: 1,
                                features: selected_features,
                            },
                            {
                                onSuccess: () => setCurrentStep(1),
                            },
                        );
                    }}
                >
                    Tovább a beállításokhoz
                </Button>
            </div>
        );
    }

    // Lépés 1+: Konkrét funkció nézet betöltése
    const active_feature_id = selected_features[current_step - 1];
    const ActiveFeatureComponent = feature_registry[active_feature_id]?.view;
    const is_last_step = current_step === selected_features.length;

    const handleFeatureDataChange = (field_name: string, value: any) => {
        setFeatureSettings((prev) => ({
            ...prev,
            [active_feature_id]: {
                ...prev[active_feature_id],
                [field_name]: value,
            },
        }));
    };

    const handleNext = () => {
        if (is_last_step) {
            router.post(
                `/guilds/${guild.id}/setup/feature/${active_feature_id}`,
                {
                    next_step: current_step,
                    settings: feature_settings[active_feature_id] || {},
                },
                {
                    onSuccess: () => {
                        router.post(`/guilds/${guild.id}/setup/finish`);
                    },
                },
            );
        } else {
            router.post(
                `/guilds/${guild.id}/setup/feature/${active_feature_id}`,
                {
                    next_step: current_step + 1,
                    settings: feature_settings[active_feature_id] || {},
                },
                {
                    onSuccess: () => setCurrentStep(current_step + 1),
                },
            );
        }
    };

    return (
        <div className="mx-auto max-w-2xl py-10">
            <h2 className="mb-2 text-2xl font-bold">
                {feature_registry[active_feature_id]?.title} beállítása
            </h2>
            <div className="mt-6">
                {ActiveFeatureComponent && (
                    <ActiveFeatureComponent
                        data={feature_settings[active_feature_id] || {}}
                        context_data={context_data}
                        onChange={handleFeatureDataChange}
                    />
                )}
            </div>
            <div className="mt-8 flex justify-between">
                <Button
                    variant="outline"
                    onClick={() => setCurrentStep((prev: number) => prev - 1)}
                >
                    Vissza
                </Button>
                <Button onClick={handleNext}>
                    {is_last_step ? 'Befejezés' : 'Következő'}
                </Button>
            </div>
        </div>
    );
}
