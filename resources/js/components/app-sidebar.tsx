import { Link, usePage } from '@inertiajs/react';
import {
    ActivitySquare,
    CalendarOff,
    Car,
    ChartPie,
    Gavel,
    History,
    LayoutGrid,
    Settings,
    ShieldCheck,
    Shirt,
    Users,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';

// Segédfüggvény az inicialéknak
const getInitials = (name: string): string => {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
};

export function AppSidebar() {
    // Adatok kinyerése az Inertia shared props-ból
    const { selectedGuild } = usePage<{ selectedGuild: { id: string; name: string; icon: string | null } }>().props;

    const mainNavItems: NavItem[] = [
        {
            title: 'Kezdőlap',
            href: dashboard(),
            icon: LayoutGrid,
        },
        {
            title: 'Ruházatok',
            href: route('items.index', { type: 'clothing' }),
            icon: Shirt,
        },
        {
            title: 'Járművek',
            href: route('items.index', { type: 'vehicle' }),
            icon: Car,
        },
    ];

    const adminNavItems: NavItem[] = [
        {
            title: 'Panel',
            href: route('guild.users.index'),
            icon: Users,
        },
        {
            title: 'Szolgálatban lévők',
            href: route('duty.active'),
            icon: ShieldCheck,
        },
        {
            title: 'Büntetések',
            href: route('punishment.index'),
            icon: Gavel,
        },
        {
            title: 'Szabadságok',
            href: route('holiday.index'),
            icon: CalendarOff,
        },
        {
            title: 'Duty log',
            href: route('duty.index'),
            icon: History,
        },
        {
            title: 'Statisztikák',
            href: route('statistics'),
            icon: ChartPie,
        },
        {
            title: 'Aktivitás Napló',
            href: route('activity-log.index'),
            icon: ActivitySquare,
        },
        {
            title: 'Beállítások',
            href: route('guild.settings'),
            icon: Settings,
        },
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        {selectedGuild && (
                            <SidebarMenuButton size="lg" asChild>
                                <Link href={route('dashboard')} className="flex items-center gap-3">
                                    <Avatar className="h-9 w-9 rounded-lg">
                                        {selectedGuild.icon ? (
                                            <AvatarImage
                                                src={`https://cdn.discordapp.com/icons/${selectedGuild.id}/${selectedGuild.icon}.png`}
                                                alt={selectedGuild.name}
                                            />
                                        ) : (
                                            <AvatarFallback className="rounded-lg">
                                                {getInitials(selectedGuild.name)}
                                            </AvatarFallback>
                                        )}
                                    </Avatar>
                                    <div className="flex flex-col gap-0.5 leading-none">
                                        <span className="font-semibold">{selectedGuild.name}</span>
                                    </div>
                                </Link>
                            </SidebarMenuButton>
                        )}
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain title="Általános" items={mainNavItems} />
                <NavMain title="Admin" items={adminNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={[]} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
