import { Head } from '@inertiajs/react';
import { LayoutGrid, Settings2, ShieldCheck, Wrench } from 'lucide-react';
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FeatureEnum } from '@/features/config/features'; // Ellenőrizd, hogy a FeatureEnum import útvonala helyes-e!
import DutyManagerView from '@/features/duty-manager/view';
import GeneralSettings from '@/features/general-settings';
import ModulesView from '@/features/modules-view';
import RankSystemView from '@/features/rank-system/view';
import WarningSystemView from '@/features/warning-system/view';
import AppLayout from '@/layouts/app-layout';
import type { Guild } from '@/types';

interface SettingsProps {
    guild_data: Guild & { guildSettings?: any[] }; // Típus kiterjesztése a relációval
    enabled_features: string[];
}

export default function SettingsPage({ guild_data, enabled_features }: SettingsProps) {

    // Konfigurációs nézetek dinamikus betöltése
    const renderFeatureConfig = (feature_id: string) => {
        // A guildSettings relációból keressük ki az adott modulhoz tartozó adatokat
        const current_settings = guild_data.guildSettings?.find(s => s.feature === feature_id)?.settings || {};

        const props = {
            guild_id: guild_data.id,
            initial_data: current_settings,
            is_settings_mode: true
        };

        // Switch a megfelelő nézet kiválasztására
        switch (feature_id) {
            case FeatureEnum.DUTY_MANAGER:
                return <DutyManagerView {...props} />;
            case FeatureEnum.RANK_SYSTEM:
                return <RankSystemView {...props} />;
            case FeatureEnum.WARNING_SYSTEM:
                return <WarningSystemView {...props} />;
            default:
                return null;
        }
    };

    return (
        <AppLayout>
            <Head title="Szerver beállítások" />

            <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 md:p-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Beállítások</h1>
                    <p className="text-muted-foreground">Módosítsd a szerver működését és a modulok konfigurációját.</p>
                </div>

                <Tabs defaultValue="general" className="w-full space-y-6">
                    <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
                        <TabsTrigger value="general" className="flex gap-2">
                            <Settings2 className="h-4 w-4" /> Alapok
                        </TabsTrigger>
                        <TabsTrigger value="features" className="flex gap-2">
                            <LayoutGrid className="h-4 w-4" /> Modulok
                        </TabsTrigger>
                        <TabsTrigger value="config" className="flex gap-2">
                            <Wrench className="h-4 w-4" /> Konfiguráció
                        </TabsTrigger>
                    </TabsList>

                    {/* ALAP BEÁLLÍTÁSOK */}
                    <TabsContent value="general" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Általános beállítások</CardTitle>
                                <CardDescription>Szervernév és alapvető paraméterek kezelése.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <GeneralSettings
                                    initial_data={{ name: guild_data.name }}
                                    submit_url={route('guild.settings.general.update')}
                                    method="put"
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* MODULOK BE/KIKAPCSOLÁSA */}
                    <TabsContent value="features">
                        <Card>
                            <CardHeader>
                                <CardTitle>Modulok kezelése</CardTitle>
                                <CardDescription>Kapcsold be vagy ki a szerver funkcióit.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ModulesView
                                    initial_features={enabled_features}
                                    submit_url={route('guild.setup.features.save')}
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* AKTÍV MODULOK RÉSZLETES KONFIGURÁCIÓJA */}
                    <TabsContent value="config" className="space-y-6">
                        {enabled_features.length === 0 ? (
                            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center">
                                <ShieldCheck className="mb-4 h-12 w-12 text-muted-foreground" />
                                <h3 className="font-semibold">Nincs aktív modul</h3>
                                <p className="text-sm text-muted-foreground">A konfigurációhoz előbb aktiválj egy modult a Modulok fül alatt.</p>
                            </div>
                        ) : (
                            enabled_features.map((feature_id) => (
                                <Card key={feature_id}>
                                    <CardHeader>
                                        <CardTitle className="capitalize">
                                            {feature_id.replace('_', ' ')} Beállítások
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {renderFeatureConfig(feature_id)}
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
