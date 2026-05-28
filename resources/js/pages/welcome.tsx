import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { FaDiscord } from 'react-icons/fa';
import {
    ArrowRight,
    BookOpen,
    CalendarClock,
    Check,
    Gauge,
    LayoutDashboard,
    ShieldAlert,
    TerminalSquare,
    Timer,
    Users,
} from 'lucide-react';
import MainLayout from '@/layouts/main-layout';
import StatCounter from '@/components/site/stat-counter';

const DISCORD_INVITE = 'https://discord.gg/JyPa9dhwhx';

const stats = [
    { label: 'Discord Servers', value: 4200, suffix: '+' },
    { label: 'Registered Users', value: 185000, suffix: '+' },
    { label: 'Active Subscriptions', value: 1300, suffix: '+' },
];

const features = [
    {
        icon: Timer,
        title: 'Duty Tracking',
        description: 'Members toggle on-duty status with a single slash command while accurate time totals build automatically.',
    },
    {
        icon: Users,
        title: 'Member Management',
        description: 'Maintain detailed member records, ranks, and synchronization directly from Discord or the web dashboard.',
    },
    {
        icon: ShieldAlert,
        title: 'Punishment System',
        description: 'Issue tiered verbal warnings, formal warnings, and blacklists with optional expiry and severity levels.',
    },
    {
        icon: CalendarClock,
        title: 'Holiday Management',
        description: 'Let staff register approved time off so they are automatically excluded from activity requirements.',
    },
    {
        icon: TerminalSquare,
        title: 'Native Slash Commands',
        description: 'Every action runs through fast, autocompleted Discord slash commands your team already understands.',
    },
    {
        icon: LayoutDashboard,
        title: 'Web Dashboard',
        description: 'Review duty leaderboards, punishments, and holidays from a synchronized browser dashboard.',
    },
];

const free_features = [
    'Duty toggle & time tracking',
    'Member records & sync',
    'Basic punishment commands',
    'Holiday registration',
    'Community support',
];

const premium_features = [
    'Everything in Free',
    'Advanced duty leaderboards & periods',
    'Full punishment tiers & expiry',
    'Priority command processing',
    'Premium web dashboard analytics',
    'Priority Discord support',
];

const fade_up = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0 },
};

export default function Welcome() {
    return (
        <MainLayout>
            <Head title="DutyManager v3 — Discord Staff Management" />

            {/* HERO */}
            <section className="relative overflow-hidden px-4 pt-36 pb-24 sm:px-6 lg:px-8">
                <div
                    aria-hidden
                    className="pointer-events-none absolute -top-32 left-1/2 h-[480px] w-[820px] -translate-x-1/2 rounded-full opacity-30 blur-[120px]"
                    style={{ background: 'radial-gradient(circle at 30% 40%, #FF2A2A, transparent 60%), radial-gradient(circle at 70% 60%, #2A85FF, transparent 60%)' }}
                />

                <div className="relative mx-auto max-w-4xl text-center">
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={fade_up}
                        transition={{ duration: 0.5 }}
                        className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-white/70 backdrop-blur"
                    >
                        <span className="h-1.5 w-1.5 rounded-full bg-[#00E676]" />
                        <span className="font-mono">v3.0 Stable — now available</span>
                    </motion.div>

                    <motion.h1
                        initial="hidden"
                        animate="visible"
                        variants={fade_up}
                        transition={{ duration: 0.5, delay: 0.05 }}
                        className="text-balance text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl"
                    >
                        Command Your{' '}
                        <span className="bg-gradient-to-r from-[#FF4B4B] via-[#FF2A2A] to-[#4B9BFF] bg-clip-text text-transparent">
                            Discord Staff
                        </span>
                    </motion.h1>

                    <motion.p
                        initial="hidden"
                        animate="visible"
                        variants={fade_up}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-white/60"
                    >
                        DutyManager v3 tracks on-duty time, manages member records, enforces punishments, and handles
                        staff holidays — all from native slash commands and a synchronized web dashboard.
                    </motion.p>

                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={fade_up}
                        transition={{ duration: 0.5, delay: 0.15 }}
                        className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
                    >
                        <a
                            href={DISCORD_INVITE}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FF2A2A] to-[#FF4B4B] px-6 py-3 text-sm font-semibold text-white shadow-[0_0_30px_rgba(255,75,75,0.4)] transition-transform hover:scale-[1.03] sm:w-auto"
                        >
                            <FaDiscord className="h-5 w-5" />
                            Add to Discord
                        </a>
                        <Link
                            href="/docs"
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition-colors hover:border-white/30 hover:bg-white/10 sm:w-auto"
                        >
                            <BookOpen className="h-4 w-4" />
                            Read the Docs
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* STATS */}
            <section id="stats" className="px-4 py-16 sm:px-6 lg:px-8">
                <div className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-3">
                    {stats.map((stat, index) => (
                        <motion.div
                            key={stat.label}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, amount: 0.5 }}
                            variants={fade_up}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="rounded-2xl border border-white/10 bg-[#121212]/70 p-8 text-center backdrop-blur transition-colors hover:border-[#2A85FF]/40"
                        >
                            <div className="bg-gradient-to-r from-[#FF4B4B] to-[#4B9BFF] bg-clip-text text-4xl font-extrabold text-transparent sm:text-5xl">
                                <StatCounter value={stat.value} suffix={stat.suffix} />
                            </div>
                            <div className="mt-2 text-sm font-medium text-white/50">{stat.label}</div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* FEATURES */}
            <section id="features" className="px-4 py-24 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-6xl">
                    <div className="mx-auto max-w-2xl text-center">
                        <span className="font-mono text-xs font-semibold uppercase tracking-widest text-[#4B9BFF]">Features</span>
                        <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
                            Everything your staff team needs
                        </h2>
                        <p className="mt-4 text-pretty text-white/60">
                            Purpose-built tools for communities that take their management seriously.
                        </p>
                    </div>

                    <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {features.map((feature, index) => (
                            <motion.div
                                key={feature.title}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true, amount: 0.3 }}
                                variants={fade_up}
                                transition={{ duration: 0.45, delay: (index % 3) * 0.08 }}
                                className="group rounded-2xl border border-white/10 bg-[#121212]/60 p-6 backdrop-blur transition-all hover:border-[#FF4B4B]/40 hover:bg-[#1A1A24]/60"
                            >
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-[#FF2A2A]/20 to-[#2A85FF]/20 text-[#FF4B4B] transition-colors group-hover:text-[#4B9BFF]">
                                    <feature.icon className="h-5 w-5" />
                                </div>
                                <h3 className="mt-5 text-lg font-semibold text-white">{feature.title}</h3>
                                <p className="mt-2 text-sm leading-relaxed text-white/55">{feature.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* PRICING */}
            <section id="pricing" className="px-4 py-24 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-5xl">
                    <div className="mx-auto max-w-2xl text-center">
                        <span className="font-mono text-xs font-semibold uppercase tracking-widest text-[#4B9BFF]">Pricing</span>
                        <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
                            Simple, transparent plans
                        </h2>
                    </div>

                    {/* Disclaimer */}
                    <div className="mx-auto mt-8 flex max-w-2xl items-center gap-3 rounded-xl border border-[#FF4B4B]/40 bg-[#FF2A2A]/10 px-5 py-4 text-center">
                        <ShieldAlert className="h-5 w-5 shrink-0 text-[#FF4B4B]" />
                        <p className="text-sm font-medium text-white/80">
                            Premium subscriptions can exclusively be purchased via our Discord server.
                        </p>
                    </div>

                    <div className="mt-10 grid gap-6 md:grid-cols-2">
                        {/* FREE */}
                        <div className="flex flex-col rounded-2xl border border-white/10 bg-[#121212]/60 p-8 backdrop-blur">
                            <h3 className="text-lg font-semibold text-white">Free</h3>
                            <p className="mt-1 text-sm text-white/50">For getting started with staff management.</p>
                            <div className="mt-6 flex items-baseline gap-1">
                                <span className="text-4xl font-extrabold text-white">$0</span>
                                <span className="text-sm text-white/50">/ forever</span>
                            </div>
                            <ul className="mt-7 flex flex-1 flex-col gap-3">
                                {free_features.map((item) => (
                                    <li key={item} className="flex items-start gap-3 text-sm text-white/70">
                                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#00E676]" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <a
                                href={DISCORD_INVITE}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition-colors hover:border-white/30 hover:bg-white/10"
                            >
                                <FaDiscord className="h-4 w-4" /> Add for Free
                            </a>
                        </div>

                        {/* PREMIUM */}
                        <div className="relative flex flex-col overflow-hidden rounded-2xl border border-[#2A85FF]/40 bg-[#121212]/80 p-8 shadow-[0_0_40px_rgba(42,133,255,0.18)] backdrop-blur">
                            <div
                                aria-hidden
                                className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-40 blur-3xl"
                                style={{ background: 'radial-gradient(circle, #2A85FF, transparent 70%)' }}
                            />
                            <div className="relative flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-white">Premium</h3>
                                <span className="rounded-full bg-gradient-to-r from-[#4B9BFF] to-[#2A85FF] px-3 py-1 text-[11px] font-semibold text-white">
                                    Most Popular
                                </span>
                            </div>
                            <p className="relative mt-1 text-sm text-white/50">For established, high-volume communities.</p>
                            <div className="relative mt-6 flex items-baseline gap-1">
                                <span className="bg-gradient-to-r from-[#FF4B4B] to-[#4B9BFF] bg-clip-text text-4xl font-extrabold text-transparent">
                                    Upgrade
                                </span>
                            </div>
                            <ul className="relative mt-7 flex flex-1 flex-col gap-3">
                                {premium_features.map((item) => (
                                    <li key={item} className="flex items-start gap-3 text-sm text-white/80">
                                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#4B9BFF]" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <a
                                href={DISCORD_INVITE}
                                target="_blank"
                                rel="noreferrer"
                                className="relative mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2A85FF] to-[#4B9BFF] px-5 py-3 text-sm font-semibold text-white shadow-[0_0_24px_rgba(42,133,255,0.4)] transition-transform hover:scale-[1.02]"
                            >
                                Get Premium on Discord
                                <ArrowRight className="h-4 w-4" />
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* PLAN COMPARISON ACCENT (kept lightweight) */}
            <section className="px-4 pb-28 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#1A1A24]/80 to-[#121212]/80 p-10 text-center backdrop-blur">
                    <Gauge className="mx-auto h-8 w-8 text-[#4B9BFF]" />
                    <h2 className="mt-5 text-balance text-2xl font-bold tracking-tight sm:text-3xl">
                        Ready to level up your server management?
                    </h2>
                    <p className="mx-auto mt-3 max-w-xl text-pretty text-white/60">
                        Invite DutyManager v3 in under a minute and run <span className="font-mono text-white/80">/install</span> to get started.
                    </p>
                    <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
                        <a
                            href={DISCORD_INVITE}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FF2A2A] to-[#FF4B4B] px-6 py-3 text-sm font-semibold text-white shadow-[0_0_30px_rgba(255,75,75,0.4)] transition-transform hover:scale-[1.03]"
                        >
                            <FaDiscord className="h-5 w-5" /> Add to Discord
                        </a>
                        <Link
                            href="/contact"
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition-colors hover:border-white/30"
                        >
                            Contact Us
                        </Link>
                    </div>
                </div>
            </section>
        </MainLayout>
    );
}
