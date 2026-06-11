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
import { usePermissions } from '@/hooks/use-permissions';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';

const getInitials = (name: string): string => {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
};

export function AppSidebar() {
    const { can, canAny } = usePermissions();
    const { selectedGuild } = usePage<{ selectedGuild: { id: string; name: string; icon: string | null } }>()
        .props;

    const mainNavItems: NavItem[] = [
        {
            title: 'Kezdőlap',
            href: dashboard(),
            icon: LayoutGrid,
        },
    ];

    if (canAny(['view_item_clothes', 'view_items'])) {
        mainNavItems.push({
            title: 'Ruházatok',
            href: route('items.index', { type: 'clothing' }),
            icon: Shirt,
        });
    }

    if (canAny(['view_item_vehicles', 'view_items'])) {
        mainNavItems.push({
            title: 'Járművek',
            href: route('items.index', { type: 'vehicle' }),
            icon: Car,
        });
    }

    const adminNavItems: NavItem[] = [];

    if (can('view_guild_users')) {
        adminNavItems.push({
            title: 'Panel',
            href: route('guild.users.index'),
            icon: Users,
        });
    }

    if (can('view_duties')) {
        adminNavItems.push({
            title: 'Szolgálatban lévők',
            href: route('duty.active'),
            icon: ShieldCheck,
        });
    }

    if (can('view_punishments')) {
        adminNavItems.push({
            title: 'Büntetések',
            href: route('punishment.index'),
            icon: Gavel,
        });
    }

    if (can('view_holidays')) {
        adminNavItems.push({
            title: 'Szabadságok',
            href: route('holiday.index'),
            icon: CalendarOff,
        });
    }

    if (can('view_duties')) {
        adminNavItems.push({
            title: 'Duty log',
            href: route('duty.index'),
            icon: History,
        });
    }

    if (can('view_statistics')) {
        adminNavItems.push({
            title: 'Statisztikák',
            href: route('statistics'),
            icon: ChartPie,
        });
    }

    if (can('view_logs')) {
        adminNavItems.push({
            title: 'Aktivitás Napló',
            href: route('activity-log.index'),
            icon: ActivitySquare,
        });
    }

    if (canAny(['view_guild_settings', 'edit_settings'])) {
        adminNavItems.push({
            title: 'Beállítások',
            href: route('guild.settings'),
            icon: Settings,
        });
    }

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        {selectedGuild && (
                            <SidebarMenuButton size="lg" asChild>
                                <Link href={route('dashboard')} className="flex items-center gap-3">
                                    <Avatar className="h-9 w-9 rounded-lg">
                                        {selectedGuild.icon_url ? (
                                            <AvatarImage src={selectedGuild.icon} alt={selectedGuild.name} />
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
