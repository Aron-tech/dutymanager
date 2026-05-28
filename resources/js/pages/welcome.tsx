import { Head, Link, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
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
import { FaDiscord } from 'react-icons/fa';
import StatCounter from '@/components/site/stat-counter';
import MainLayout from '@/layouts/main-layout';

const DISCORD_INVITE = 'https://discord.gg/JyPa9dhwhx';

interface SharedPageProps {
    translations: Record<string, any>;
    [key: string]: any;
}

const stats = [
    { label: 'landing.stats.servers', value: 4200, suffix: '+' },
    { label: 'landing.stats.users', value: 185000, suffix: '+' },
    { label: 'landing.stats.subscriptions', value: 1300, suffix: '+' },
];

const features = [
    {
        icon: Timer,
        title: 'landing.features.duty_tracking.title',
        description: 'landing.features.duty_tracking.description',
    },
    {
        icon: Users,
        title: 'landing.features.member_management.title',
        description: 'landing.features.member_management.description',
    },
    {
        icon: ShieldAlert,
        title: 'landing.features.punishment_system.title',
        description: 'landing.features.punishment_system.description',
    },
    {
        icon: CalendarClock,
        title: 'landing.features.holiday_management.title',
        description: 'landing.features.holiday_management.description',
    },
    {
        icon: TerminalSquare,
        title: 'landing.features.slash_commands.title',
        description: 'landing.features.slash_commands.description',
    },
    {
        icon: LayoutDashboard,
        title: 'landing.features.web_dashboard.title',
        description: 'landing.features.web_dashboard.description',
    },
];

const free_features = [
    'landing.pricing.free.feature_1',
    'landing.pricing.free.feature_2',
    'landing.pricing.free.feature_3',
    'landing.pricing.free.feature_4',
    'landing.pricing.free.feature_5',
];

const premium_features = [
    'landing.pricing.premium.feature_1',
    'landing.pricing.premium.feature_2',
    'landing.pricing.premium.feature_3',
    'landing.pricing.premium.feature_4',
    'landing.pricing.premium.feature_5',
    'landing.pricing.premium.feature_6',
];

const fade_up = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0 },
};

export default function Welcome() {
    const { props } = usePage<SharedPageProps>();

    const __ = (key: string, replace: Record<string, string | number> = {}): string => {
        const parts = key.split('.');
        let translation: any = props.translations;

        for (const part of parts) {
            if (translation && translation[part] !== undefined) {
                translation = translation[part];
            } else {
                translation = key;
                break;
            }
        }

        if (typeof translation !== 'string') {
            return key;
        }

        Object.keys(replace).forEach((token) => {
            translation = translation.replace(`:${token}`, String(replace[token]));
        });

        return translation;
    };

    return (
        <MainLayout>
            <Head title={__('landing.meta.title')} />

            {/* HERO */}
            <section className="relative overflow-hidden px-4 pt-36 pb-24 sm:px-6 lg:px-8">
                <div
                    aria-hidden
                    className="pointer-events-none absolute -top-32 left-1/2 h-[480px] w-[820px] -translate-x-1/2 rounded-full opacity-30 blur-[120px]"
                    style={{
                        background:
                            'radial-gradient(circle at 30% 40%, #FF2A2A, transparent 60%), radial-gradient(circle at 70% 60%, #2A85FF, transparent 60%)',
                    }}
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
                        <span className="font-mono">{__('landing.hero.badge')}</span>
                    </motion.div>

                    <motion.h1
                        initial="hidden"
                        animate="visible"
                        variants={fade_up}
                        transition={{ duration: 0.5, delay: 0.05 }}
                        className="text-balance text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl"
                    >
                        {__('landing.hero.title_part_1')}{' '}
                        <span className="bg-gradient-to-r from-[#FF4B4B] via-[#FF2A2A] to-[#4B9BFF] bg-clip-text text-transparent">
                            {__('landing.hero.title_highlight')}
                        </span>
                    </motion.h1>

                    <motion.p
                        initial="hidden"
                        animate="visible"
                        variants={fade_up}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-white/60"
                    >
                        {__('landing.hero.subtitle')}
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
                            {__('landing.buttons.add_to_discord')}
                        </a>
                        <Link
                            href="/docs"
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition-colors hover:border-white/30 hover:bg-white/10 sm:w-auto"
                        >
                            <BookOpen className="h-4 w-4" />
                            {__('landing.buttons.read_docs')}
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
                            <div className="mt-2 text-sm font-medium text-white/50">{__(stat.label)}</div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* FEATURES */}
            <section id="features" className="px-4 py-24 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-6xl">
                    <div className="mx-auto max-w-2xl text-center">
                        <span className="font-mono text-xs font-semibold uppercase tracking-widest text-[#4B9BFF]">
                            {__('landing.features.eyebrow')}
                        </span>
                        <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
                            {__('landing.features.title')}
                        </h2>
                        <p className="mt-4 text-pretty text-white/60">{__('landing.features.subtitle')}</p>
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
                                <h3 className="mt-5 text-lg font-semibold text-white">{__(feature.title)}</h3>
                                <p className="mt-2 text-sm leading-relaxed text-white/55">{__(feature.description)}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* PRICING */}
            <section id="pricing" className="px-4 py-24 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-5xl">
                    <div className="mx-auto max-w-2xl text-center">
                        <span className="font-mono text-xs font-semibold uppercase tracking-widest text-[#4B9BFF]">
                            {__('landing.pricing.eyebrow')}
                        </span>
                        <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
                            {__('landing.pricing.title')}
                        </h2>
                    </div>

                    {/* Disclaimer */}
                    <div className="mx-auto mt-8 flex max-w-2xl items-center gap-3 rounded-xl border border-[#FF4B4B]/40 bg-[#FF2A2A]/10 px-5 py-4 text-center">
                        <ShieldAlert className="h-5 w-5 shrink-0 text-[#FF4B4B]" />
                        <p className="text-sm font-medium text-white/80">{__('landing.pricing.disclaimer')}</p>
                    </div>

                    <div className="mt-10 grid gap-6 md:grid-cols-2">
                        {/* FREE */}
                        <div className="flex flex-col rounded-2xl border border-white/10 bg-[#121212]/60 p-8 backdrop-blur">
                            <h3 className="text-lg font-semibold text-white">{__('landing.pricing.free.title')}</h3>
                            <p className="mt-1 text-sm text-white/50">{__('landing.pricing.free.subtitle')}</p>
                            <div className="mt-6 flex items-baseline gap-1">
                                <span className="text-4xl font-extrabold text-white">$0</span>
                                <span className="text-sm text-white/50">/ {__('landing.pricing.free.period')}</span>
                            </div>
                            <ul className="mt-7 flex flex-1 flex-col gap-3">
                                {free_features.map((item) => (
                                    <li key={item} className="flex items-start gap-3 text-sm text-white/70">
                                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#00E676]" />
                                        {__(item)}
                                    </li>
                                ))}
                            </ul>
                            <a
                                href={DISCORD_INVITE}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition-colors hover:border-white/30 hover:bg-white/10"
                            >
                                <FaDiscord className="h-4 w-4" /> {__('landing.buttons.add_for_free')}
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
                                <h3 className="text-lg font-semibold text-white">{__('landing.pricing.premium.title')}</h3>
                                <span className="rounded-full bg-gradient-to-r from-[#4B9BFF] to-[#2A85FF] px-3 py-1 text-[11px] font-semibold text-white">
                                    {__('landing.pricing.premium.badge')}
                                </span>
                            </div>
                            <p className="relative mt-1 text-sm text-white/50">
                                {__('landing.pricing.premium.subtitle')}
                            </p>
                            <div className="relative mt-6 flex items-baseline gap-1">
                                <span className="bg-gradient-to-r from-[#FF4B4B] to-[#4B9BFF] bg-clip-text text-4xl font-extrabold text-transparent">
                                    {__('landing.pricing.premium.price')}
                                </span>
                            </div>
                            <ul className="relative mt-7 flex flex-1 flex-col gap-3">
                                {premium_features.map((item) => (
                                    <li key={item} className="flex items-start gap-3 text-sm text-white/80">
                                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#4B9BFF]" />
                                        {__(item)}
                                    </li>
                                ))}
                            </ul>
                            <a
                                href={DISCORD_INVITE}
                                target="_blank"
                                rel="noreferrer"
                                className="relative mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2A85FF] to-[#4B9BFF] px-5 py-3 text-sm font-semibold text-white shadow-[0_0_24px_rgba(42,133,255,0.4)] transition-transform hover:scale-[1.02]"
                            >
                                {__('landing.buttons.get_premium')}
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
                        {__('landing.cta.title')}
                    </h2>
                    <p className="mx-auto mt-3 max-w-xl text-pretty text-white/60">
                        {__('landing.cta.subtitle_part_1')}{' '}
                        <span className="font-mono text-white/80">/install</span> {__('landing.cta.subtitle_part_2')}
                    </p>
                    <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
                        <a
                            href={DISCORD_INVITE}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FF2A2A] to-[#FF4B4B] px-6 py-3 text-sm font-semibold text-white shadow-[0_0_30px_rgba(255,75,75,0.4)] transition-transform hover:scale-[1.03]"
                        >
                            <FaDiscord className="h-5 w-5" /> {__('landing.buttons.add_to_discord')}
                        </a>
                        <Link
                            href="/contact"
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition-colors hover:border-white/30"
                        >
                            {__('landing.buttons.contact_us')}
                        </Link>
                    </div>
                </div>
            </section>
        </MainLayout>
    );
}
