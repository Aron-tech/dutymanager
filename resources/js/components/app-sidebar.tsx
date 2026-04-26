import { Link } from '@inertiajs/react';
import { Users, LayoutGrid, Gavel, History, Shirt, Car } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
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

const footerNavItems: NavItem[] = [];

export function AppSidebar() {
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
        }
    ];
    const adminNavItems: NavItem[] = [
        {
            title: 'Panel',
            href: route('guild.users.index'),
            icon: Users,
        },
        {
            title: 'Büntetések',
            href: route('punishment.index'),
            icon: Gavel,
        },
        {
            title: 'Duty log',
            href: route('duty.index'),
            icon: History,
        }
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                    <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain title="Általános" items={mainNavItems} />
                <NavMain title="Admin" items={adminNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
