import { router, useForm } from '@inertiajs/react';
import {
    CheckCircle2,
    AlertCircle,
    TerminalSquare,
    ArrowLeft,
    Loader2,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import type { Guild } from '@/types';

interface FinishViewProps {
    guild: Guild;
    onBack: () => void;
}

export default function FinishView({ guild, onBack }: FinishViewProps) {
    const { post, processing, errors } = useForm({});
    const [countdown, setCountdown] = useState(60);

    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    router.reload({
                        only: ['guild'],
                        preserveScroll: true,
                        preserveState: true,
                    });

                    return 60;
                }

                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const handleFinish = () => {
        post(route('guild.setup.finish'));
    };

    return (
        <div className="animate-in space-y-8 duration-500 fade-in slide-in-from-bottom-2">
            <div className="mb-6 border-b pb-6 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <CheckCircle2 className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">
                    Beállítások véglegesítése
                </h3>
                <p className="mt-2 text-muted-foreground">
                    Már csak egyetlen lépés maradt hátra a rendszer
                    aktiválásához.
                </p>
            </div>

            {errors.installation && (
                <Alert variant="destructive" className="border-2 shadow-sm">
                    <AlertCircle className="h-5 w-5" />
                    <AlertTitle className="text-base font-semibold">
                        Sikertelen ellenőrzés!
                    </AlertTitle>
                    <AlertDescription className="mt-1 font-medium">
                        {errors.installation}
                    </AlertDescription>
                </Alert>
            )}

            <div className="rounded-xl border bg-accent/30 p-6 shadow-inner">
                <h4 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                    <TerminalSquare className="h-5 w-5 text-primary" />
                    Aktiváld a botot a Discord szerveren
                </h4>
                <ol className="ml-6 list-decimal space-y-3 text-sm text-muted-foreground">
                    <li>
                        Nyisd meg a Discord szerveredet (
                        <strong>{guild.name}</strong>).
                    </li>
                    <li>
                        Keress egy olyan csatornát, ahova a botnak van
                        jogosultsága írni.
                    </li>
                    <li>
                        Írd be a{' '}
                        <code className="rounded border bg-background px-1.5 py-0.5 font-mono font-bold text-primary">
                            /install
                        </code>{' '}
                        parancsot és küldd el.
                    </li>
                    <li>
                        Várd meg, amíg a bot sikeresen visszaigazolja a
                        telepítést.
                    </li>
                    <li>
                        Kattints az alábbi "Befejezés" gombra az ellenőrzéshez!
                    </li>
                </ol>

                <div className="mt-6 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-primary"></div>
                    A rendszer {countdown} másodperc múlva automatikusan is
                    lekérdezi a szerver állapotát.
                </div>
            </div>

            <div className="mt-12 flex items-center justify-between border-t pt-6">
                <Button variant="ghost" onClick={onBack} disabled={processing}>
                    Vissza
                </Button>

                <Button
                    onClick={handleFinish}
                    disabled={processing}
                    className="min-w-[200px] shadow-lg shadow-primary/20"
                >
                    {processing && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Befejezés és Ellenőrzés
                </Button>
            </div>
        </div>
    );
}
