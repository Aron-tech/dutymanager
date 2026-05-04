import { Head, router, usePage } from '@inertiajs/react';
import { ChevronRight, Plus, Server } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AppHeaderLayout from '@/layouts/app/app-header-layout';
import CreateEditModal from '@/pages/guild-users/_create-edit-modal';
import type { BreadcrumbItem, UserDetailsConfig } from '@/types';

const __ = (key: string): string => {
    return (window as any).translations?.[key] || key;
};

interface DiscordGuild {
    discord_id: string;
    name: string;
    icon: string | null;
    is_installed?: boolean;
}

interface SelectorPageProps {
    [key: string]: unknown;

    guilds: {
        my_servers: DiscordGuild[];
        pending_addition: DiscordGuild[];
    };
    show_request_modal?: boolean;
    modal_config_data?: UserDetailsConfig[];
    target_discord_id?: string;
    original_url?: string;
}

export default function Selector({
    guilds,
    show_request_modal = false,
    modal_config_data = [],
    target_discord_id,
    original_url,
}: SelectorPageProps) {
    const { my_servers, pending_addition } = guilds;
    const [is_modal_open, setIsModalOpen] =
        useState<boolean>(show_request_modal);
    const { props } = usePage();
    const flash = props.flash as { success: string | null; error: string | null };

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }

        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    // 1. Modal nyitásának kezelése
    useEffect(() => {
        if (show_request_modal) {
            setIsModalOpen(true);
        }
    }, [show_request_modal]);

    // 2. Böngésző URL visszaírása (History API replaceState)
    useEffect(() => {
        if (original_url && window.location.href !== original_url) {
            window.history.replaceState(window.history.state, '', original_url);
        }
    }, [original_url]);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: __('guilds.selector.breadcrumb'), href: '/guilds/selector' },
    ];

    const handleSelectServer = (discord_id: string) => {
        router.post(`/guilds/select/${discord_id}`);
    };

    const handleAddBot = () => {

        window.location.assign(
            `https://discord.com/oauth2/authorize?client_id=1485260478048505876`,
        );
    };

    return (
        <AppHeaderLayout breadcrumbs={breadcrumbs}>
            <Head title={__('guilds.selector.page_title')} />

            <div className="mx-auto flex h-full w-full max-w-5xl flex-col gap-8 p-6 lg:p-10">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold tracking-tight">
                        {__('guilds.selector.heading')}
                    </h1>
                    <p className="text-muted-foreground">
                        {__('guilds.selector.subheading')}
                    </p>
                </div>

                <div>
                    <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
                        <Server className="h-5 w-5 text-primary" />
                        {__('guilds.selector.my_servers_title')}
                    </h2>

                    {my_servers.length === 0 ? (
                        <Card className="border-dashed bg-muted/20">
                            <CardContent className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                                {__('guilds.selector.no_servers')}
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {my_servers.map((guild) => (
                                <Card
                                    key={guild.discord_id}
                                    className="cursor-pointer overflow-hidden transition-colors hover:border-primary/50"
                                    onClick={() =>
                                        handleSelectServer(guild.discord_id)
                                    }
                                >
                                    <CardContent className="flex items-center justify-between gap-3 p-4">
                                        <div className="flex min-w-0 items-center space-x-3">
                                            <Avatar className="h-10 w-10 flex-shrink-0">
                                                <AvatarImage
                                                    src={
                                                        guild.icon
                                                            ? `https://cdn.discordapp.com/icons/${guild.discord_id}/${guild.icon}.png`
                                                            : ''
                                                    }
                                                />
                                                <AvatarFallback>
                                                    {guild.name.charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex min-w-0 flex-col">
                                                <span className="truncate font-medium">
                                                    {guild.name}
                                                </span>
                                                <span className="truncate text-xs text-muted-foreground">
                                                    {guild.is_installed
                                                        ? __(
                                                              'guilds.status.installed',
                                                          )
                                                        : __(
                                                              'guilds.status.install_required',
                                                          )}
                                                </span>
                                            </div>
                                        </div>
                                        <ChevronRight className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                <div>
                    <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
                        <Plus className="h-5 w-5 text-primary" />
                        {__('guilds.selector.pending_title')}
                    </h2>

                    {pending_addition.length === 0 ? (
                        <Card className="border-dashed bg-muted/20">
                            <CardContent className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                                {__('guilds.selector.no_pending')}
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {pending_addition.map((guild) => (
                                <Card
                                    key={guild.discord_id}
                                    className="overflow-hidden opacity-80 transition-opacity hover:opacity-100"
                                >
                                    <CardContent className="flex items-center justify-between gap-3 p-4">
                                        <div className="flex min-w-0 items-center space-x-3">
                                            <Avatar className="h-10 w-10 flex-shrink-0">
                                                <AvatarImage
                                                    src={
                                                        guild.icon
                                                            ? `https://cdn.discordapp.com/icons/${guild.discord_id}/${guild.icon}.png`
                                                            : ''
                                                    }
                                                />
                                                <AvatarFallback>
                                                    {guild.name.charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="truncate font-medium">
                                                {guild.name}
                                            </span>
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
                                            <span className="hidden sm:inline">
                                                {__('guilds.action.add')}
                                            </span>
                                            <Plus className="h-3 w-3 sm:ml-2" />
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <CreateEditModal
                is_open={is_modal_open}
                onClose={() => setIsModalOpen(false)}
                user_details_config={modal_config_data}
                unattached_guild_users={[]}
                has_rank_system={false}
                available_ranks={[]}
                is_request_mode={!!target_discord_id}
                target_discord_id={target_discord_id}
            />
        </AppHeaderLayout>
    );
}
