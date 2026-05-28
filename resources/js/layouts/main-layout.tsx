import { Link, router, usePage } from '@inertiajs/react';
import { Menu, Search, X } from 'lucide-react';
import { FaDiscord } from 'react-icons/fa';
import React, { useEffect, useState } from 'react';
import SiteLogo from '@/components/site/site-logo';
import SearchModal from '@/components/site/search-modal';

const DISCORD_INVITE = 'https://discord.gg/JyPa9dhwhx';

const nav_links = [
    { label: 'Home', href: '/' },
    { label: 'Features', href: '/#features' },
    { label: 'Pricing', href: '/#pricing' },
    { label: 'Docs', href: '/docs' },
    { label: 'Contact', href: '/contact' },
];

// Subtle carbon-fiber weave texture used across every public page.
const carbon_background: React.CSSProperties = {
    backgroundColor: '#0D0D12',
    backgroundImage:
        'repeating-linear-gradient(45deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 4px), repeating-linear-gradient(-45deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 4px)',
};

export default function MainLayout({ children }: { children: React.ReactNode }) {
    const { url } = usePage();
    const [mobile_open, setMobileOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [search_open, setSearchOpen] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 16);
        window.addEventListener('scroll', onScroll);
        onScroll();

        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // Global Cmd+K / Ctrl+K search shortcut.
    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
                event.preventDefault();
                setSearchOpen((previous) => !previous);
            }
        };

        const onOpenRequest = () => setSearchOpen(true);

        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('open-docs-search', onOpenRequest);

        return () => {
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('open-docs-search', onOpenRequest);
        };
    }, []);

    const isActive = (href: string) => {
        if (href === '/') {
            return url === '/';
        }

        return url.startsWith(href.replace('/#', '/'));
    };

    const navigate = (href: string) => {
        setMobileOpen(false);

        if (href.startsWith('/#')) {
            const target_id = href.slice(2);

            if (url === '/' || url.startsWith('/?')) {
                document.getElementById(target_id)?.scrollIntoView({ behavior: 'smooth' });
                return;
            }

            router.visit('/', {
                onFinish: () => {
                    window.setTimeout(() => document.getElementById(target_id)?.scrollIntoView({ behavior: 'smooth' }), 120);
                },
            });
            return;
        }

        router.visit(href);
    };

    return (
        <div className="min-h-screen text-white selection:bg-[#FF2A2A]/30" style={carbon_background}>
            {/* NAVBAR */}
            <header
                className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
                    scrolled
                        ? 'border-b border-white/10 bg-[#0D0D12]/80 backdrop-blur-xl'
                        : 'border-b border-transparent bg-transparent'
                }`}
            >
                <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    <button type="button" onClick={() => navigate('/')} className="cursor-pointer">
                        <SiteLogo />
                    </button>

                    <nav className="hidden items-center gap-1 lg:flex">
                        {nav_links.map((item) => (
                            <button
                                key={item.href}
                                type="button"
                                onClick={() => navigate(item.href)}
                                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                                    isActive(item.href) ? 'text-white' : 'text-white/60 hover:text-white'
                                }`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </nav>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setSearchOpen(true)}
                            className="hidden items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/50 transition-colors hover:border-white/20 hover:text-white/80 sm:flex"
                        >
                            <Search className="h-3.5 w-3.5" />
                            <span>Search</span>
                            <kbd className="rounded border border-white/10 bg-white/5 px-1.5 font-mono text-[10px] text-white/50">
                                ⌘K
                            </kbd>
                        </button>

                        <a
                            href={DISCORD_INVITE}
                            target="_blank"
                            rel="noreferrer"
                            className="hidden items-center gap-2 rounded-lg bg-gradient-to-r from-[#FF2A2A] to-[#FF4B4B] px-4 py-2 text-sm font-semibold text-white shadow-[0_0_20px_rgba(255,75,75,0.35)] transition-transform hover:scale-[1.03] sm:flex"
                        >
                            <FaDiscord className="h-4 w-4" />
                            Add to Discord
                        </a>

                        <button
                            type="button"
                            aria-label="Toggle menu"
                            onClick={() => setMobileOpen((previous) => !previous)}
                            className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white lg:hidden"
                        >
                            {mobile_open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </button>
                    </div>
                </div>

                {/* MOBILE NAV */}
                {mobile_open && (
                    <div className="border-t border-white/10 bg-[#0D0D12]/95 backdrop-blur-xl lg:hidden">
                        <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4">
                            {nav_links.map((item) => (
                                <button
                                    key={item.href}
                                    type="button"
                                    onClick={() => navigate(item.href)}
                                    className="rounded-lg px-3 py-2.5 text-left text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white"
                                >
                                    {item.label}
                                </button>
                            ))}
                            <button
                                type="button"
                                onClick={() => {
                                    setMobileOpen(false);
                                    setSearchOpen(true);
                                }}
                                className="mt-1 flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2.5 text-left text-sm font-medium text-white/70"
                            >
                                <Search className="h-4 w-4" /> Search
                            </button>
                            <a
                                href={DISCORD_INVITE}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#FF2A2A] to-[#FF4B4B] px-4 py-2.5 text-sm font-semibold text-white"
                            >
                                <FaDiscord className="h-4 w-4" /> Add to Discord
                            </a>
                        </nav>
                    </div>
                )}
            </header>

            <main>{children}</main>

            {/* FOOTER */}
            <footer className="border-t border-white/10 bg-[#0D0D12]/80">
                <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
                    <div className="lg:col-span-1">
                        <SiteLogo />
                        <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/50">
                            The duty-tracking and staff-management platform built for serious Discord communities.
                        </p>
                        <a
                            href={DISCORD_INVITE}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-5 inline-flex items-center gap-2 rounded-lg border border-[#4B9BFF]/30 bg-[#2A85FF]/10 px-4 py-2 text-sm font-medium text-[#4B9BFF] transition-colors hover:bg-[#2A85FF]/20"
                        >
                            <FaDiscord className="h-4 w-4" /> Join our Discord
                        </a>
                    </div>

                    <div>
                        <h4 className="text-sm font-semibold text-white">Product</h4>
                        <ul className="mt-4 flex flex-col gap-3 text-sm">
                            <li><button type="button" onClick={() => navigate('/#features')} className="text-white/50 hover:text-white">Features</button></li>
                            <li><button type="button" onClick={() => navigate('/#pricing')} className="text-white/50 hover:text-white">Pricing</button></li>
                            <li><button type="button" onClick={() => navigate('/#stats')} className="text-white/50 hover:text-white">Statistics</button></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-sm font-semibold text-white">Resources</h4>
                        <ul className="mt-4 flex flex-col gap-3 text-sm">
                            <li><Link href="/docs" className="text-white/50 hover:text-white">Documentation</Link></li>
                            <li><Link href="/contact" className="text-white/50 hover:text-white">Contact</Link></li>
                            <li>
                                <a href={DISCORD_INVITE} target="_blank" rel="noreferrer" className="text-white/50 hover:text-white">
                                    Support Server
                                </a>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-sm font-semibold text-white">Legal</h4>
                        <ul className="mt-4 flex flex-col gap-3 text-sm">
                            <li><Link href="/terms" className="text-white/50 hover:text-white">Terms of Service</Link></li>
                            <li><Link href="/privacy" className="text-white/50 hover:text-white">Privacy Policy</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-white/10">
                    <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 text-xs text-white/40 sm:flex-row sm:px-6 lg:px-8">
                        <span>© {new Date().getFullYear()} DutyManager v3. All rights reserved.</span>
                        <span>Not affiliated with or endorsed by Discord Inc.</span>
                    </div>
                </div>
            </footer>

            <SearchModal open={search_open} onOpenChange={setSearchOpen} />
        </div>
    );
}
