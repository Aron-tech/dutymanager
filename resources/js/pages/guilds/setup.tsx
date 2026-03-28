import { Head, router } from '@inertiajs/react';
import { useForm } from 'laravel-precognition-react-inertia';
import React, { useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { feature_registry } from '@/features/config/features';
import GeneralSettings from '@/features/general-settings';
import UserDetails from '@/features/user-details';
import AppLayout from '@/layouts/app-layout';
import type { Guild, GuildSettings } from '@/types';

const MANDATORY_VIEWS = ['general_settings', 'modules'];

interface SetupProps {
    guild: Guild;
    settings: GuildSettings & { current_view?: string };
    context_data: Record<string, any>;
}

export default function Setup({ guild, settings, context_data }: SetupProps) {
    const flow = useMemo(() => {
        const selectedFeatures = settings.features || [];

        return [...MANDATORY_VIEWS, ...selectedFeatures];
    }, [settings.features]);

    const currentViewIndex = flow.indexOf(
        settings.current_view || 'general_settings',
    );
    const currentView = flow[currentViewIndex !== -1 ? currentViewIndex : 0];
    const isLastStep = currentViewIndex === flow.length - 1;
    const nextView = isLastStep ? 'finish' : flow[currentViewIndex + 1];

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
            settings: settings.feature_settings?.[currentView] || {},
            next_view: nextView,
        },
    );

    // Ha a currentView változik (pl. a user a Vissza gombra kattint),
    // frissíteni kell a form adatokat a megfelelő nézet szerinti adatokkal.
    useEffect(() => {
        setFeatureData({
            settings: settings.feature_settings?.[currentView] || {},
            next_view: nextView,
        });
    }, [currentView, isLastStep, nextView, setFeatureData, settings.feature_settings]);

    const {
        data: moduleData,
        setData: setModuleData,
        submit: submitModules,
        processing: moduleProcessing,
    } = useForm('post', route('guild.setup.features.save'), {
        features: settings.features || [],
        next_view: nextView,
    });

    const handleNext = () => {
        if (currentView === 'modules') {
            submitModules({
                preserveScroll: true,
            });

            return;
        }

        // feature settings mentése Precognition-nel
        submitFeature({
            preserveScroll: true,
            onSuccess: () => {
                if (isLastStep) {
                    router.post(route('guild.setup.finish'));
                }
            },
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
            case 'general_settings':
                return (
                    <GeneralSettings
                        data={featureData.settings || {}}
                        context_data={context_data as any}
                        errors={errors as Record<string, string>}
                        onChange={(field: string, value: any) => {
                            clearErrors(`settings.${field}`);

                            setFeatureData('settings', {
                                ...featureData.settings,
                                [field]: value,
                            });

                            // Valós idejű Precognition validáció (kis késleltetéssel, hogy a setFeatureData befejeződjön)
                            setTimeout(() => validate(`settings.${field}` as any), 150);
                        }}
                    />
                );

            case 'user_details':
                return (
                    <UserDetails
                        data={
                            settings.user_details_config ||
                            featureData.settings ||
                            {}
                        }
                        onChange={(_field, value) => {
                            setFeatureData('settings', value);
                        }}
                    />
                );

            case 'modules':
                return (
                    <div className="space-y-4">
                        <div className="border-b pb-2">
                            <h3 className="text-lg font-semibold text-foreground">
                                Modulok aktiválása
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Válaszd ki, mely funkciókat szeretnéd használni
                                a szerveren.
                            </p>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            {Object.values(feature_registry).map((feature) => (
                                <div
                                    key={feature.id}
                                    className="flex items-center space-x-3 rounded-xl border bg-card/50 p-4 transition-all hover:bg-accent/50"
                                >
                                    <Checkbox
                                        id={`feature-${feature.id}`}
                                        checked={moduleData.features.includes(
                                            feature.id,
                                        )}
                                        onCheckedChange={(checked) => {
                                            const updated = checked
                                                ? [
                                                      ...moduleData.features,
                                                      feature.id,
                                                  ]
                                                : moduleData.features.filter(
                                                      (id) => id !== feature.id,
                                                  );
                                            setModuleData('features', updated);
                                        }}
                                    />
                                    <label
                                        htmlFor={`feature-${feature.id}`}
                                        className="flex-1 cursor-pointer leading-none font-medium"
                                    >
                                        {feature.title}
                                    </label>
                                </div>
                            ))}
                        </div>
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
                        <ActiveFeatureComponent
                            data={featureData.settings || {}}
                            context_data={context_data}
                            errors={errors as Record<string, string>}
                            onChange={(field: string, value: any) => {
                                clearErrors(`settings.${field}`);
                                setFeatureData('settings', {
                                    ...featureData.settings,
                                    [field]: value,
                                });
                                setTimeout(() => validate(`settings.${field}` as any), 150);
                            }}
                        />
                    </div>
                ) : (
                    <div className="flex h-40 items-center justify-center rounded-lg border-2 border-dashed">
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
        <>
            <Head title={`Szerver Setup - ${guild.name}`} />
            <div className="container mx-auto max-w-4xl px-4 py-8">
                {/* Header szekció */}
                <div className="mb-8 flex flex-col gap-2">
                    <h2 className="text-3xl font-extrabold tracking-tight text-primary">
                        Szerver Inicializálás
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

                {/* Wizard Kártya */}
                <div className="overflow-hidden rounded-2xl border bg-card shadow-xl transition-all">
                    <div className="p-8">
                        <div className="min-h-[400px]">
                            {renderStepContent()}
                        </div>

                        {/* Navigációs sáv */}
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

                            <div className="flex gap-3">
                                <Button
                                    onClick={handleNext}
                                    disabled={isProcessing}
                                    className="min-w-[140px] shadow-lg shadow-primary/20"
                                >
                                    {isLastStep
                                        ? 'Beállítások véglegesítése'
                                        : 'Következő lépés'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

Setup.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={[{ title: 'Szerver Setup', href: '#' }]}>
        {page}
    </AppLayout>
);
