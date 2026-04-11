import { Package } from 'lucide-react';
import React from 'react';
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';

interface ModulesViewProps {
    features: { id: string; name: string; description: string }[];
    selectedFeatures: string[];
    onChange: (features: string[]) => void;
    error?: string;
}

export default function ModulesView({
                                        features,
                                        selectedFeatures,
                                        onChange,
                                        error,
                                    }: ModulesViewProps) {
    const handleToggle = (featureId: string, isChecked: boolean) => {
        if (isChecked) {
            onChange([...selectedFeatures, featureId]);
        } else {
            onChange(selectedFeatures.filter((id) => id !== featureId));
        }
    };

    return (
        <div className="animate-in space-y-6 duration-500 fade-in slide-in-from-bottom-2">
            <div className="mb-6 border-b pb-4">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                    <Package className="h-5 w-5 text-primary" />
                    Modulok aktiválása
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                    Válaszd ki azokat a funkciókat, amelyeket használni szeretnél a szervereden. A bekapcsolt modulokat a következő lépésekben fogod tudni testreszabni.
                </p>
            </div>

            {features.length === 0 ? (
                <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground italic">
                    Jelenleg nincsenek elérhető funkciók a rendszerben.
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {features.map((feature) => {
                        const isEnabled = selectedFeatures.includes(feature.id);

                        return (
                            <Card
                                key={feature.id}
                                className={`border-2 transition-all duration-200 ${isEnabled ? 'border-primary/50 bg-primary/5' : 'hover:border-primary/20'}`}
                            >
                                <CardHeader className="flex flex-row items-start justify-between space-y-0 p-5">
                                    <div className="space-y-1.5 pr-4">
                                        <CardTitle className="text-base leading-none font-semibold tracking-tight">
                                            {feature.name}
                                        </CardTitle>
                                        <CardDescription className="text-sm">
                                            {feature.description}
                                        </CardDescription>
                                    </div>
                                    <Switch
                                        checked={isEnabled}
                                        onCheckedChange={(checked) => handleToggle(feature.id, checked)}
                                        className="mt-0.5"
                                    />
                                </CardHeader>
                            </Card>
                        );
                    })}
                </div>
            )}

            {error && (
                <p className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm font-medium text-destructive">
                    {error}
                </p>
            )}
        </div>
    );
}
