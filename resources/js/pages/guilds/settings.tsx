// resources/js/pages/guilds/settings.tsx
import { useForm, usePage } from '@inertiajs/react';
import type { FormEventHandler} from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DutyManagerTab from './tabs/duty-manager-tab';
import GeneralSettingsTab from './tabs/general-settings-tab';

export default function GuildSettings() {
    const { guild, initialSettings, initialEnabledFeatures } = usePage().props;

    const { data, setData, put, processing, errors, isDirty } = useForm({
        enabled_features: initialEnabledFeatures as string[],
        settings: initialSettings as Record<string, any>,
    });

    const [activeTab, setActiveTab] = useState('general');

    const toggleFeature = (feature: string, enabled: boolean) => {
        setData('enabled_features', enabled
            ? [...data.enabled_features, feature]
            : data.enabled_features.filter(f => f !== feature)
        );
    };

    const updateSetting = (feature: string, key: string, value: any) => {
        setData('settings', {
            ...data.settings,
            [feature]: {
                ...data.settings[feature],
                [key]: value
            }
        });
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(route('guilds.settings.update', guild.id), {
            preserveScroll: true,
        });
    };

    return (
        <form onSubmit={submit} className="max-w-5xl mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Guild Beállítások</h1>
                <Button type="submit" disabled={!isDirty || processing}>
                    Módosítások Mentése
                </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-4 w-full">
                    <TabsTrigger value="general">Általános</TabsTrigger>
                    <TabsTrigger value="duty_manager">Duty Manager</TabsTrigger>
                    <TabsTrigger value="warning_system">Warning System</TabsTrigger>
                    <TabsTrigger value="rank_system">Rank System</TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="mt-6">
                    <GeneralSettingsTab
                        settings={data.settings.general}
                        onChange={(k, v) => updateSetting('general', k, v)}
                        errors={errors}
                    />
                </TabsContent>

                <TabsContent value="duty_manager" className="mt-6">
                    <DutyManagerTab
                        isEnabled={data.enabled_features.includes('duty_manager')}
                        onToggle={(enabled) => toggleFeature('duty_manager', enabled)}
                        settings={data.settings.duty_manager}
                        onChange={(k, v) => updateSetting('duty_manager', k, v)}
                        errors={errors}
                    />
                </TabsContent>

                {/* Warning System, Rank System Tabs... */}
            </Tabs>
        </form>
    );
}
