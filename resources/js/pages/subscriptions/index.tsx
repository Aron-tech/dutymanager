import { useForm, Head, usePage } from '@inertiajs/react';
import { CheckCircle, ArrowLeft, Server, CreditCard, ShieldCheck } from 'lucide-react';
import React, { useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { toast } from 'sonner';

export default function SubscriptionPage({ subscriptions, savings, userSubscriptions, availableGuilds }) {
    const { flash } = usePage().props;

    const { data, setData, post, processing, errors } = useForm({
        plan: 'monthly',
        guild_id: '',
    });

    const { data: guildData, setData: setGuildData, put, processing: guildProcessing, errors: guildErrors } = useForm({
        guild_id: '',
    });

    useEffect(() => {
        if (flash?.error) {
            toast.error(flash.error);
        }
        if (flash?.success) {
            toast.success(flash.success);
        }
    }, [flash]);

    function handleSubscription(e, plan) {
        e.preventDefault();
        setData('plan', plan);
        setTimeout(() => {
            post(route('subscriptions.store'), {
                preserveScroll: true,
                onError: (errors) => {
                    if (errors.plan) toast.error(errors.plan);
                    if (errors.error) toast.error(errors.error); // Catch generic errors sent via withErrors
                }
            });
        }, 50);
    }

    function handleGuildChange(e, subscriptionId) {
        e.preventDefault();
        put(route('subscriptions.update', { subscription: subscriptionId }), {
            preserveScroll: true,
            onSuccess: () => toast.success('Szerver sikeresen módosítva!'),
            onError: (errors) => {
                if (errors.guild_id) toast.error(errors.guild_id);
            }
        });
    }

    return (
        <AppLayout breadcrumbs={[{ title: 'Előfizetések', href: route('subscriptions.index') }]}>
            <Head title="Előfizetések" />

            <div className="flex h-full flex-1 flex-col gap-8 overflow-x-auto rounded-xl p-4 md:p-8 lg:p-12 max-w-7xl mx-auto w-full">

                <div className="flex items-center gap-4 mb-2">
                    <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Prémium Csomagok</h1>
                        <p className="text-muted-foreground mt-1">Válaszd ki a számodra megfelelő előfizetést, hogy hozzáférj az összes funkcióhoz.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
                    {Object.entries(subscriptions).map(([plan, details]) => (
                        <Card
                            key={plan}
                            className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg ${plan === 'yearly' ? 'border-primary shadow-md scale-[1.02] md:scale-105 z-10' : 'border-border'}`}
                        >
                            {plan === 'yearly' && (
                                <div className="absolute top-0 right-0">
                                    <div className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg flex items-center gap-1 shadow-sm">
                                        <ShieldCheck className="w-3 h-3" />
                                        Legjobb ajánlat
                                    </div>
                                </div>
                            )}

                            <CardHeader className="pb-4">
                                <CardTitle className="text-2xl capitalize flex items-center justify-between">
                                    <span>{plan === 'monthly' ? 'Havi' : 'Éves'} csomag</span>
                                </CardTitle>
                                <CardDescription>
                                    Teljes hozzáférés a rendszerhez {plan === 'monthly' ? 'havi' : 'éves'} számlázással.
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="pb-6">
                                <div className="flex items-end gap-2 mb-6 relative">
                                    <span className="text-5xl font-extrabold tracking-tight">{details.price} Ft</span>
                                    <span className="text-muted-foreground font-medium mb-1">/ {plan === 'monthly' ? 'hó' : 'év'}</span>

                                    {plan === 'yearly' && (
                                        <Badge variant="secondary" className="absolute -top-12 -right-4 md:-right-8 px-4 py-2 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800 transform rotate-12 shadow-sm font-bold text-sm">
                                            Spórolj {savings} Ft-ot!
                                        </Badge>
                                    )}
                                </div>

                                <div className="space-y-4 pt-4 border-t border-border">
                                    <p className="font-semibold text-sm text-foreground/80 uppercase tracking-wider">Mit tartalmaz?</p>
                                    <ul className="space-y-3">
                                        {details.features.map((feature, index) => (
                                            <li key={index} className="flex items-start gap-3 text-sm text-muted-foreground">
                                                <CheckCircle className="text-primary h-5 w-5 shrink-0 mt-0.5" />
                                                <span className="leading-tight">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </CardContent>

                            <CardFooter>
                                <Button
                                    className={`w-full text-base font-semibold py-6 ${plan === 'yearly' ? 'bg-primary hover:bg-primary/90' : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground'}`}
                                    disabled={processing}
                                    onClick={(e) => handleSubscription(e, plan)}
                                >
                                    <CreditCard className="mr-2 h-5 w-5" />
                                    Előfizetés indítása
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>

                {userSubscriptions.length > 0 && (
                    <div className="mt-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center gap-3 mb-6">
                            <Server className="h-6 w-6 text-primary" />
                            <h2 className="text-2xl font-bold tracking-tight">Meglévő előfizetéseid</h2>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {userSubscriptions.map(sub => (
                                <Card key={sub.id} className="border-sidebar-border/70 bg-sidebar/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
                                    <CardContent className="p-6">
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                            <div className="space-y-2 w-full">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-semibold text-lg flex items-center gap-2">
                                                        <span className="capitalize">{sub.type === 'monthly' ? 'Havi' : 'Éves'}</span> csomag
                                                    </span>
                                                    <Badge variant={sub.stripe_status === 'active' ? 'default' : 'secondary'} className="capitalize">
                                                        {sub.stripe_status}
                                                    </Badge>
                                                </div>

                                                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2 bg-background/50 p-2 rounded-md">
                                                    <Server className="h-4 w-4" />
                                                    <span>
                                                        Hozzárendelt szerver:
                                                        <span className="font-medium text-foreground ml-1">
                                                            {sub.guild ? sub.guild.name : 'Nincs hozzárendelve'}
                                                        </span>
                                                    </span>
                                                </div>
                                            </div>

                                            {availableGuilds.length > 0 && (
                                                <form onSubmit={(e) => handleGuildChange(e, sub.id)} className="flex flex-col gap-2 w-full sm:w-auto mt-4 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-border">
                                                    <select
                                                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                        onChange={(e) => setGuildData('guild_id', e.target.value)}
                                                        defaultValue=""
                                                    >
                                                        <option value="" disabled>Válassz szervert</option>
                                                        {availableGuilds.map(guild => (
                                                            <option key={guild.id} value={guild.id}>{guild.name}</option>
                                                        ))}
                                                    </select>
                                                    <Button
                                                        type="submit"
                                                        size="sm"
                                                        disabled={guildProcessing || !guildData.guild_id}
                                                        className="w-full"
                                                    >
                                                        Szerver módosítása
                                                    </Button>
                                                    {/* Hibajelzés itt is megjelenik, de a toast is mutatja */}
                                                </form>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
