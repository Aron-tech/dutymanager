import { Head, router, usePage } from '@inertiajs/react';
import { ChevronRight, Server, Plus } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { route } from 'ziggy-js';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppHeaderLayout from '@/layouts/app/app-header-layout';
import type { BreadcrumbItem } from '@/types';
import { discord } from '@/routes/login';

// Feltételezve, hogy a window.__ globálisan elérhető (Laravel/Inertia i18n setup)
const __ = (key: string): string => {
    return (window as any).translations?.[key] || key;
};

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
    flash?: {
        showRequestModal?: boolean;
        modalConfigData?: ConfigField[];
        targetDiscordId?: string;
    };
}

export default function Selector({ guilds }: PageProps) {
    const { my_servers, pending_addition } = guilds;
    const { flash } = usePage<PageProps>().props;

    const [is_modal_open, setIsModalOpen] = useState<boolean>(false);
    const [form_data, setFormData] = useState<Record<string, string>>({});

    const breadcrumbs: BreadcrumbItem[] = [
        { title: __('guilds.selector.breadcrumb'), href: '/guilds/selector' },
    ];

    useEffect(() => {
        if (flash?.showRequestModal) {
            setIsModalOpen(true);
            const initial_data: Record<string, string> = {};
            (flash.modalConfigData || []).forEach((field) => {
                initial_data[field.name] = '';
            });
            setFormData(initial_data);
        }
    }, [flash]);

    const handleSelectServer = (discord_id: string) => {
        router.post(`/guilds/select/${discord_id}`);
    };

    const handleAddBot = (discord_id: string) => {
        const client_id = import.meta.env.VITE_DISCORD_CLIENT_ID;
        const permissions = '8';
        const invite_url = `https://discord.com/oauth2/authorize?client_id=${client_id}&permissions=${permissions}&integration_type=0&scope=bot+applications.commands&guild_id=${discord_id}`;

        window.location.href = invite_url;
    };

    const handleRequestSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!flash?.targetDiscordId) return;

        router.post(route('guilds.request', flash.targetDiscordId), {
            config_data: form_data
        }, {
            onSuccess: () => setIsModalOpen(false)
        });
    };

    return (
        <AppHeaderLayout breadcrumbs={breadcrumbs}>
            <Head title={__('guilds.selector.page_title')} />

            <div className="flex h-full flex-col gap-8 p-6 lg:p-10 max-w-5xl mx-auto w-full">

                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold tracking-tight">{__('guilds.selector.heading')}</h1>
                    <p className="text-muted-foreground">{__('guilds.selector.subheading')}</p>
                </div>

                {/* --- SZERVEREIM SZEKCIÓ --- */}
                <div>
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <Server className="w-5 h-5 text-primary" />
                        {__('guilds.selector.my_servers_title')}
                    </h2>

                    {my_servers.length === 0 ? (
                        <Card className="border-dashed bg-muted/20">
                            <CardContent className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                                {__('guilds.selector.no_servers')}
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {my_servers.map((guild) => (
                                <Card
                                    key={guild.discord_id}
                                    className="hover:border-primary/50 transition-colors cursor-pointer overflow-hidden"
                                    onClick={() => handleSelectServer(guild.discord_id)}
                                >
                                    <CardContent className="flex items-center justify-between p-4 gap-3">
                                        <div className="flex items-center space-x-3 min-w-0">
                                            <Avatar className="h-10 w-10 flex-shrink-0">
                                                <AvatarImage src={guild.icon ? `https://cdn.discordapp.com/icons/${guild.discord_id}/${guild.icon}.png` : ''} />
                                                <AvatarFallback>{guild.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col min-w-0">
                                                <span className="font-medium truncate">{guild.name}</span>
                                                <span className="text-xs text-muted-foreground truncate">
                                                    {guild.is_installed ? __('guilds.status.installed') : __('guilds.status.install_required')}
                                                </span>
                                            </div>
                                        </div>
                                        <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
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
                        {__('guilds.selector.pending_title')}
                    </h2>

                    {pending_addition.length === 0 ? (
                        <Card className="border-dashed bg-muted/20">
                            <CardContent className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                                {__('guilds.selector.no_pending')}
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {pending_addition.map((guild) => (
                                <Card key={guild.discord_id} className="opacity-80 hover:opacity-100 transition-opacity overflow-hidden">
                                    <CardContent className="flex items-center justify-between p-4 gap-3">
                                        <div className="flex items-center space-x-3 min-w-0">
                                            <Avatar className="h-10 w-10 flex-shrink-0">
                                                <AvatarImage src={guild.icon ? `https://cdn.discordapp.com/icons/${guild.discord_id}/${guild.icon}.png` : ''} />
                                                <AvatarFallback>{guild.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium truncate">{guild.name}</span>
                                        </div>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            className="flex-shrink-0"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleAddBot(guild.discord_id);
                                            }}
                                        >
                                            <span className="hidden sm:inline">{__('guilds.action.add')}</span>
                                            <Plus className="sm:ml-2 w-3 h-3" />
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <Dialog open={is_modal_open} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <form onSubmit={handleRequestSubmit}>
                        <DialogHeader>
                            <DialogTitle>{__('guilds.modal.title')}</DialogTitle>
                            <DialogDescription>{__('guilds.modal.description')}</DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 py-4">
                            {(flash?.modalConfigData || []).map((field, index) => (
                                <div className="grid gap-2" key={index}>
                                    <Label htmlFor={field.name}>{field.label}</Label>
                                    <Input
                                        id={field.name}
                                        required={field.is_required}
                                        value={form_data[field.name] || ''}
                                        onChange={(e) => setFormData({...form_data, [field.name]: e.target.value})}
                                    />
                                </div>
                            ))}
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                                {__('common.cancel')}
                            </Button>
                            <Button type="submit">{__('guilds.modal.submit')}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppHeaderLayout>
    );
}
