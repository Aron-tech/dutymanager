import { FormEventHandler, useState } from 'react';
import { useForm, usePage, Head } from '@inertiajs/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import AppLayout from '@/layouts/app-layout';

import GeneralSettings from '@/features/general-settings';
import UserDetails from '@/features/user-details';
import DutyManagerView from '@/features/duty-manager/view';
import WarningSystemView from '@/features/warning-system/view';
import RankSystemView from '@/features/rank-system/view';

interface PageProps {
    guild: { id: string; [key: string]: any };
    initialSettings: Record<string, any>;
    initialEnabledFeatures: string[];
    context_data: Record<string, any>;
}

export default function GuildSettings() {
    const { guild, initialSettings, initialEnabledFeatures, context_data } =
        usePage<PageProps>().props;

    const { data, setData, put, processing, errors, isDirty } = useForm({
        enabled_features: initialEnabledFeatures || [],
        settings: initialSettings || {},
    });

    const [activeTab, setActiveTab] = useState('general');

    const toggleFeature = (feature: string, enabled: boolean) => {
        setData(
            'enabled_features',
            enabled
                ? [...data.enabled_features, feature]
                : data.enabled_features.filter((f) => f !== feature),
        );
    };

    const updateSetting = (feature: string, key: string, value: any) => {
        setData('settings', {
            ...data.settings,
            [feature]: {
                ...(data.settings[feature] || {}),
                [key]: value,
            },
        });
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(route('guild.settings.update', guild.id), {
            preserveScroll: true,
        });
    };

    const getFeatureProps = (featureKey: string) => ({
        data: data.settings[featureKey] || {},
        setData: (key: string, value: any) => updateSetting(featureKey, key, value),
        onChange: (key: string, value: any) => updateSetting(featureKey, key, value),
        errors: Object.keys(errors).reduce(
            (acc, curr) => {
                if (curr.startsWith(`settings.${featureKey}.`)) {
                    acc[curr.replace(`settings.${featureKey}.`, '')] = errors[curr];
                }

                return acc;
            },
            {} as Record<string, string>,
        ),
        context_data: context_data,
    });

    return (
        <AppLayout>
            <Head title="Guild Beállítások" />
            <div className="container mx-auto space-y-6 px-4 py-8">
                <form onSubmit={submit} className="mx-auto max-w-5xl space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                                Guild Beállítások
                            </h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                A szerver moduljainak és funkcióinak konfigurálása.
                            </p>
                        </div>
                        <Button type="submit" disabled={!isDirty || processing}>
                            Módosítások Mentése
                        </Button>
                    </div>

                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="grid w-full grid-cols-5">
                            <TabsTrigger value="general">Általános</TabsTrigger>
                            <TabsTrigger value="user_details">Felhasználók</TabsTrigger>
                            <TabsTrigger value="duty_manager">Duty Manager</TabsTrigger>
                            <TabsTrigger value="warning_system">
                                Warning System
                            </TabsTrigger>
                            <TabsTrigger value="rank_system">Rank System</TabsTrigger>
                        </TabsList>

                        <TabsContent
                            value="general"
                            className="mt-6 rounded-lg border bg-card p-6 shadow-sm"
                        >
                            <GeneralSettings {...getFeatureProps('general')} />
                        </TabsContent>

                        <TabsContent
                            value="user_details"
                            className="mt-6 rounded-lg border bg-card p-6 shadow-sm"
                        >
                            <UserDetails {...getFeatureProps('user_details')} />
                        </TabsContent>

                        <TabsContent
                            value="duty_manager"
                            className="mt-6 space-y-4 rounded-lg border bg-card p-6 shadow-sm"
                        >
                            <div className="mb-4 flex items-center justify-between border-b pb-4">
                                <div>
                                    <h3 className="text-lg font-medium">
                                        Duty Manager
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        Szolgálatkezelő modul engedélyezése és
                                        beállítása.
                                    </p>
                                </div>
                                <Switch
                                    checked={data.enabled_features.includes(
                                        'duty_manager',
                                    )}
                                    onCheckedChange={(c) =>
                                        toggleFeature('duty_manager', c)
                                    }
                                />
                            </div>
                            <div
                                className={
                                    !data.enabled_features.includes('duty_manager')
                                        ? 'pointer-events-none opacity-50'
                                        : 'transition-opacity'
                                }
                            >
                                <DutyManagerView {...getFeatureProps('duty_manager')} />
                            </div>
                        </TabsContent>

                        <TabsContent
                            value="warning_system"
                            className="mt-6 space-y-4 rounded-lg border bg-card p-6 shadow-sm"
                        >
                            <div className="mb-4 flex items-center justify-between border-b pb-4">
                                <div>
                                    <h3 className="text-lg font-medium">
                                        Warning System
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        Figyelmeztető modul engedélyezése.
                                    </p>
                                </div>
                                <Switch
                                    checked={data.enabled_features.includes(
                                        'warning_system',
                                    )}
                                    onCheckedChange={(c) =>
                                        toggleFeature('warning_system', c)
                                    }
                                />
                            </div>
                            <div
                                className={
                                    !data.enabled_features.includes('warning_system')
                                        ? 'pointer-events-none opacity-50'
                                        : 'transition-opacity'
                                }
                            >
                                <WarningSystemView
                                    {...getFeatureProps('warning_system')}
                                />
                            </div>
                        </TabsContent>

                        <TabsContent
                            value="rank_system"
                            className="mt-6 space-y-4 rounded-lg border bg-card p-6 shadow-sm"
                        >
                            <div className="mb-4 flex items-center justify-between border-b pb-4">
                                <div>
                                    <h3 className="text-lg font-medium">Rank System</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Rangrendszer modul engedélyezése.
                                    </p>
                                </div>
                                <Switch
                                    checked={data.enabled_features.includes(
                                        'rank_system',
                                    )}
                                    onCheckedChange={(c) =>
                                        toggleFeature('rank_system', c)
                                    }
                                />
                            </div>
                            <div
                                className={
                                    !data.enabled_features.includes('rank_system')
                                        ? 'pointer-events-none opacity-50'
                                        : 'transition-opacity'
                                }
                            >
                                <RankSystemView {...getFeatureProps('rank_system')} />
                            </div>
                        </TabsContent>
                    </Tabs>
                </form>
            </div>
        </AppLayout>
    );
}
