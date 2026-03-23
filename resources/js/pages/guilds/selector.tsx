import { Head, router, usePage } from '@inertiajs/react';
import { ChevronRight, Server, Plus, ExternalLink } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// JAVÍTÁS: AppLayout helyett AppHeaderLayout importálása
import AppHeaderLayout from '@/layouts/app/app-header-layout';
import type { BreadcrumbItem } from '@/types';

// --- Típusdefiníciók ---
interface Guild {
    discord_id: string;
    name: string;
    icon: string | null;
    is_installed?: boolean;
}

interface ConfigField {
    name: string;
    label: string;
    is_required: boolean;
}

interface PageProps {
    guilds: {
        my_servers: Guild[];
        pending_addition: Guild[];
    };
    // A backend által küldött "flash" adatok a 2. esethez
    flash?: {
        showRequestModal?: boolean;
        modalConfigData?: ConfigField[];
        targetDiscordId?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Szerver Választó', href: '/guilds/selector' },
];

export default function Selector({ guilds }: PageProps) {
    const { my_servers, pending_addition } = guilds;
    const { flash } = usePage<PageProps>().props;

    // Állapotok a Modalhoz (2. eset)
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [formData, setFormData] = useState<Record<string, string>>({});

    // Ha a backend visszaadta, hogy ki kell nyitni a modalt
    useEffect(() => {
        if (flash?.showRequestModal) {
            setIsModalOpen(true);
            const initialData: Record<string, string> = {};
            (flash.modalConfigData || []).forEach((field) => {
                initialData[field.name] = '';
            });
            setFormData(initialData);
        }
    }, [flash]);

    // Szerver kiválasztása
    const handleSelectServer = (discordId: string) => {
        router.post(route('guilds.selected', discordId));
    };

    // Bot hozzáadása új szerverhez
    const handleAddBot = (discordId: string) => {
        const clientId = import.meta.env.VITE_DISCORD_CLIENT_ID;
        const permissions = '8';
        const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=${permissions}&integration_type=0&scope=bot+applications.commands&guild_id=${discordId}`;

        // eslint-disable-next-line react-hooks/immutability
        window.location.href = inviteUrl;
    };

    // 2. Eset: Kérelem leadása
    const handleRequestSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!flash?.targetDiscordId) return;

        router.post(route('guilds.request', flash.targetDiscordId), {
            config_data: formData
        }, {
            onSuccess: () => setIsModalOpen(false)
        });
    };

    return (
        // JAVÍTÁS: AppHeaderLayout használata, hogy ne legyen sidebar
        <AppHeaderLayout breadcrumbs={breadcrumbs}>
            <Head title="Szerver Választó" />

            <div className="flex h-full flex-col gap-8 p-6 lg:p-10 max-w-5xl mx-auto w-full">

                {/* Fejléc szöveg */}
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold tracking-tight">Válassz szervert</h1>
                    <p className="text-muted-foreground">
                        Kérlek válaszd ki a kezelni kívánt szervert, vagy hívj be új botot egy általad kezelt szerverre.
                    </p>
                </div>

                {/* --- SZERVEREIM SZEKCIÓ --- */}
                <div>
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <Server className="w-5 h-5 text-primary" />
                        Szervereim
                    </h2>

                    {my_servers.length === 0 ? (
                        <Card className="border-dashed bg-muted/20">
                            <CardContent className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                                Jelenleg egyetlen közös szerverünk sincs.
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {my_servers.map((guild) => (
                                <Card
                                    key={guild.discord_id}
                                    className="hover:border-primary/50 transition-colors cursor-pointer"
                                    onClick={() => handleSelectServer(guild.discord_id)}
                                >
                                    <CardContent className="flex items-center justify-between p-4">
                                        <div className="flex items-center space-x-4">
                                            <Avatar className="h-12 w-12">
                                                <AvatarImage src={guild.icon ? `https://cdn.discordapp.com/icons/${guild.discord_id}/${guild.icon}.png` : ''} />
                                                <AvatarFallback>{guild.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span className="font-medium truncate max-w-[150px]">{guild.name}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {guild.is_installed ? 'Telepítve' : 'Telepítés szükséges'}
                                                </span>
                                            </div>
                                        </div>
                                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                {/* --- HOZZÁADÁSRA VÁR SZEKCIÓ --- */}
                <div>
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <Plus className="w-5 h-5 text-primary" />
                        Hozzáadásra vár
                    </h2>

                    {pending_addition.length === 0 ? (
                        <Card className="border-dashed bg-muted/20">
                            <CardContent className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                                Nincs olyan szerver, ahova hozzáadhatnád a botot.
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {pending_addition.map((guild) => (
                                <Card key={guild.discord_id} className="opacity-80 hover:opacity-100 transition-opacity">
                                    <CardContent className="flex items-center justify-between p-4">
                                        <div className="flex items-center space-x-4">
                                            <Avatar className="h-10 w-10">
                                                <AvatarImage src={guild.icon ? `https://cdn.discordapp.com/icons/${guild.discord_id}/${guild.icon}.png` : ''} />
                                                <AvatarFallback>{guild.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium truncate max-w-[120px]">{guild.name}</span>
                                        </div>
                                        <Button variant="secondary" size="sm" onClick={() => handleAddBot(guild.discord_id)}>
                                            Hozzáadás
                                            <ExternalLink className="ml-2 w-3 h-3" />
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

            </div>

            {/* --- 2. ESET: KÉRELEM MODAL (DIALOG) --- */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <form onSubmit={handleRequestSubmit}>
                        <DialogHeader>
                            <DialogTitle>Hozzáférési Kérelem</DialogTitle>
                            <DialogDescription>
                                A szerver használatához meg kell adnod néhány adatot.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 py-4">
                            {(flash?.modalConfigData || []).map((field, index) => (
                                <div className="grid gap-2" key={index}>
                                    <Label htmlFor={field.name}>{field.label}</Label>
                                    <Input
                                        id={field.name}
                                        required={field.is_required}
                                        value={formData[field.name] || ''}
                                        onChange={(e) => setFormData({...formData, [field.name]: e.target.value})}
                                    />
                                </div>
                            ))}
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Mégse</Button>
                            <Button type="submit">Kérelem leadása</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

        </AppHeaderLayout>
    );
}
