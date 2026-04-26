import { Head, router } from '@inertiajs/react';
import { useForm } from 'laravel-precognition-react-inertia';
import React, { useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { feature_registry } from '@/features/config/features';
import FinishView from '@/features/finish-view';
import GeneralSettings from '@/features/general-settings';
import ModulesView from '@/features/modules-view';
import UserDetailsView from '@/features/user-details';
import AppLayout from '@/layouts/app-layout';
import type { Guild, GuildSettings } from '@/types';

const MANDATORY_VIEWS = ['general_settings', 'user_details', 'modules'];

interface Feature {
    id: string;
    name: string;
    description: string;
}

interface SetupProps {
    guild: Guild;
    settings: GuildSettings & { current_view?: string };
    context_data: Record<string, any>;
    features?: Feature[];
}

const getDefaultSettings = (viewName: string) => {
    if (viewName === 'general_settings') {
        return {
            lang: 'hu',
            mode: 'preset',
            preset_roles: { user: [], staff: [], owner: [] },
            role_permissions: [],
        };
    }

    if (viewName === 'user_details') {
        return {
            require_real_name: false,
            name_format: '{first} {last}',
            log_channel_id: '',
            config: [],
        };
    }

    return {};
};

const getInitialSettings = (viewName: string, backendSettings: any) => {
    const defaults = getDefaultSettings(viewName);

    if (!backendSettings || Object.keys(backendSettings).length === 0) {
        return defaults;
    }

    return { ...defaults, ...backendSettings };
};

export default function Setup({
    guild,
    settings,
    context_data,
    features = [],
}: SetupProps) {
    const {
        data: moduleData,
        setData: setModuleData,
        submit: submitModules,
        processing: moduleProcessing,
        errors: moduleErrors,
        clearErrors: clearModuleErrors,
    } = useForm('post', route('guild.setup.features.save'), {
        features: settings.features || [],
        next_view: '',
    });

    const flow = useMemo(() => {
        return [...MANDATORY_VIEWS, ...(moduleData.features || []), 'finish'];
    }, [moduleData.features]);

    const currentViewIndex = flow.indexOf(
        settings.current_view || 'general_settings',
    );
    const currentView = flow[currentViewIndex !== -1 ? currentViewIndex : 0];

    const isLastFeature = currentViewIndex === flow.length - 2;
    const nextView =
        currentView === 'finish' ? 'finish' : flow[currentViewIndex + 1];

    const {
        data: featureData,
        setData: setFeatureData,
        errors,
        clearErrors,
        validate,
        submit: submitFeature,
        processing: formProcessing,
    } = useForm(
        'post',
        route('guild.setup.feature.save', { feature_id: currentView }),
        {
            settings: getInitialSettings(
                currentView,
                settings.feature_settings?.[currentView],
            ),
            next_view: nextView,
        },
    );

    useEffect(() => {
        setFeatureData(
            'settings',
            getInitialSettings(
                currentView,
                settings.feature_settings?.[currentView],
            ),
        );
        setModuleData('features', settings.features || []);
        clearErrors();
        clearModuleErrors();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentView]);

    useEffect(() => {
        setFeatureData('next_view', nextView);
        setModuleData('next_view', nextView);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [nextView]);

    const handleNext = () => {
        if (currentView === 'modules') {
            submitModules({ preserveScroll: true });

            return;
        }

        submitFeature({
            preserveScroll: true,
        });
    };

    const handleBack = () => {
        if (currentViewIndex > 0) {
            const prevView = flow[currentViewIndex - 1];
            router.reload({ data: { current_view: prevView } as any });
        }
    };

    const renderStepContent = () => {
        switch (currentView) {
            case 'finish':
                return <FinishView guild={guild} onBack={handleBack} />;

            case 'general_settings':
                return (
                    <div className="space-y-4">
                        <div className="mb-6 border-b pb-2">
                            <h3 className="text-lg font-semibold text-foreground">
                                Általános Beállítások
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Konfiguráld a szerver alapértelmezett nyelvét és
                                jogosultságait.
                            </p>
                        </div>
                        {errors.settings && (
                            <div className="mb-4 rounded-md border border-destructive bg-destructive/10 p-3 text-sm font-medium text-destructive">
                                {errors.settings}
                            </div>
                        )}
                        <GeneralSettings
                            data={featureData.settings || {}}
                            context_data={context_data as any}
                            errors={errors as Record<string, string>}
                            onChange={(field: string, value: any) => {
                                clearErrors(`settings.${field}`);
                                clearErrors('settings');
                                setFeatureData('settings', {
                                    ...featureData.settings,
                                    [field]: value,
                                });
                                setTimeout(
                                    () => validate(`settings.${field}` as any),
                                    200,
                                );
                            }}
                        />
                    </div>
                );

            case 'modules':
                return (
                    <ModulesView
                        features={features}
                        selectedFeatures={moduleData.features}
                        onChange={(selected) => {
                            clearModuleErrors('features');
                            setModuleData('features', selected);
                        }}
                        error={moduleErrors.features}
                    />
                );

            case 'user_details':
                return (
                    <div className="space-y-4">
                        <div className="mb-6 border-b pb-2">
                            <h3 className="text-lg font-semibold text-foreground">
                                Felhasználói Adatok
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Állítsd be, milyen adatokat kérjen be a bot a tagoktól.
                            </p>
                        </div>
                        <UserDetailsView
                            data={featureData.settings || {}}
                            context_data={context_data}
                            errors={errors as Record<string, string>}
                            onChange={(field: string, value: any) => {
                                clearErrors(`settings.${field}`);
                                setFeatureData('settings', {
                                    ...featureData.settings,
                                    [field]: value,
                                });
                                // Precognition validáció (opcionális)
                                setTimeout(() => validate(`settings.${field}` as any), 200);
                            }}
                        />
                    </div>
                );

            default: {
                const ActiveFeatureComponent =
                    feature_registry[currentView]?.view;

                return ActiveFeatureComponent ? (
                    <div className="space-y-6">
                        <div className="border-b pb-2">
                            <h3 className="text-lg font-semibold text-foreground">
                                {feature_registry[currentView]?.title}{' '}
                                testreszabása
                            </h3>
                        </div>
                        {errors.settings && (
                            <div className="mb-4 rounded-md border border-destructive bg-destructive/10 p-3 text-sm font-medium text-destructive">
                                {errors.settings}
                            </div>
                        )}
                        <ActiveFeatureComponent
                            data={featureData.settings || {}}
                            context_data={context_data}
                            errors={errors as Record<string, string>}
                            onChange={(field: string, value: any) => {
                                clearErrors(`settings.${field}`);
                                clearErrors('settings');
                                setFeatureData('settings', {
                                    ...featureData.settings,
                                    [field]: value,
                                });
                                setTimeout(
                                    () => validate(`settings.${field}` as any),
                                    200,
                                );
                            }}
                        />
                    </div>
                ) : (
                    <div className="flex h-40 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/50">
                        <p className="text-muted-foreground">
                            Nézet betöltése: {currentView}...
                        </p>
                    </div>
                );
            }
        }
    };

    const isProcessing = formProcessing || moduleProcessing;

    return (
        <AppLayout>
            <Head title={`Szerver Setup - ${guild.name}`} />
            <div className="container mx-auto max-w-4xl px-4 py-8">
                <div className="mb-8 flex flex-col gap-2">
                    <h2 className="text-3xl font-extrabold tracking-tight text-primary">
                        Szerver telepítése
                    </h2>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="font-semibold text-foreground">
                            {guild.name}
                        </span>
                        <span>•</span>
                        <span>
                            Lépés: {currentViewIndex + 1} / {flow.length}
                        </span>
                    </div>
                </div>

                <div className="overflow-hidden rounded-2xl border bg-card shadow-xl transition-all">
                    <div className="p-8">
                        <div className="min-h-[400px]">
                            {renderStepContent()}
                        </div>

                        {/* JAVÍTÁS: A finish nézetnek saját navigációja van (FinishView.tsx), így itt elrejtjük */}
                        {currentView !== 'finish' && (
                            <div className="mt-12 flex items-center justify-between border-t pt-6">
                                <Button
                                    variant="ghost"
                                    onClick={handleBack}
                                    disabled={
                                        currentViewIndex === 0 || isProcessing
                                    }
                                >
                                    Vissza
                                </Button>

                                <Button
                                    onClick={handleNext}
                                    disabled={isProcessing}
                                    className="min-w-[140px] shadow-lg shadow-primary/20"
                                >
                                    {isLastFeature
                                        ? 'Beállítások véglegesítése'
                                        : 'Következő lépés'}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
