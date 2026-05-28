import { Head, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { FaDiscord } from 'react-icons/fa';
import { ArrowUpRight, BookOpen, Mail, MessageCircle } from 'lucide-react';
import MainLayout from '@/layouts/main-layout';

const DISCORD_INVITE = 'https://discord.gg/JyPa9dhwhx';
const SUPPORT_EMAIL = 'support@dutymanager.app';

const fade_up = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0 },
};

interface SharedPageProps {
    translations: Record<string, any>;
    [key: string]: any;
}

export default function Contact() {
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
            <Head title={__('contact.meta.title')} />

            <section className="relative overflow-hidden px-4 pt-32 pb-24 sm:px-6 lg:px-8">
                <div
                    aria-hidden
                    className="pointer-events-none absolute -top-24 left-1/2 h-[360px] w-[680px] -translate-x-1/2 rounded-full opacity-25 blur-[120px]"
                    style={{
                        background:
                            'radial-gradient(circle at 40% 50%, #2A85FF, transparent 60%), radial-gradient(circle at 70% 50%, #FF2A2A, transparent 60%)',
                    }}
                />

                <div className="relative mx-auto max-w-3xl text-center">
                    <span className="font-mono text-xs font-semibold uppercase tracking-widest text-[#4B9BFF]">
                        {__('contact.header.eyebrow')}
                    </span>
                    <h1 className="mt-3 text-balance text-4xl font-extrabold tracking-tight sm:text-5xl">
                        {__('contact.header.title')}
                    </h1>
                    <p className="mx-auto mt-4 max-w-xl text-pretty text-white/60">
                        {__('contact.header.subtitle')}
                    </p>
                </div>

                <div className="relative mx-auto mt-14 grid max-w-4xl gap-6 md:grid-cols-2">
                    {/* DISCORD SUPPORT — highlighted */}
                    <motion.a
                        href={DISCORD_INVITE}
                        target="_blank"
                        rel="noreferrer"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.4 }}
                        variants={fade_up}
                        transition={{ duration: 0.5 }}
                        className="group relative flex flex-col overflow-hidden rounded-2xl border border-[#4B9BFF]/40 bg-[#121212]/80 p-7 shadow-[0_0_40px_rgba(42,133,255,0.18)] backdrop-blur md:row-span-1"
                    >
                        <div
                            aria-hidden
                            className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full opacity-40 blur-3xl"
                            style={{ background: 'radial-gradient(circle, #2A85FF, transparent 70%)' }}
                        />
                        <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#2A85FF] to-[#4B9BFF] text-white shadow-[0_0_20px_rgba(42,133,255,0.4)]">
                            <FaDiscord className="h-6 w-6" />
                        </div>
                        <h2 className="relative mt-5 flex items-center gap-2 text-xl font-semibold text-white">
                            {__('contact.discord.title')}
                            <ArrowUpRight className="h-4 w-4 text-[#4B9BFF] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        </h2>
                        <p className="relative mt-2 text-sm leading-relaxed text-white/60">
                            {__('contact.discord.description')}
                        </p>
                        <span className="relative mt-4 inline-block w-fit rounded-lg border border-[#4B9BFF]/30 bg-[#2A85FF]/10 px-3 py-1.5 font-mono text-xs text-[#4B9BFF]">
                            discord.gg/JyPa9dhwhx
                        </span>
                    </motion.a>

                    {/* EMAIL */}
                    <motion.a
                        href={`mailto:${SUPPORT_EMAIL}`}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.4 }}
                        variants={fade_up}
                        transition={{ duration: 0.5, delay: 0.08 }}
                        className="group flex flex-col rounded-2xl border border-white/10 bg-[#121212]/60 p-7 backdrop-blur transition-colors hover:border-[#FF4B4B]/40"
                    >
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-[#FF2A2A]/20 to-[#FF4B4B]/20 text-[#FF4B4B]">
                            <Mail className="h-5 w-5" />
                        </div>
                        <h2 className="mt-5 flex items-center gap-2 text-xl font-semibold text-white">
                            {__('contact.email.title')}
                            <ArrowUpRight className="h-4 w-4 text-[#FF4B4B] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        </h2>
                        <p className="mt-2 text-sm leading-relaxed text-white/60">
                            {__('contact.email.description')}
                        </p>
                        <span className="mt-4 inline-block w-fit rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-xs text-white/70">
                            {SUPPORT_EMAIL}
                        </span>
                    </motion.a>

                    {/* DOCS */}
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.4 }}
                        variants={fade_up}
                        transition={{ duration: 0.5, delay: 0.16 }}
                        className="flex flex-col rounded-2xl border border-white/10 bg-[#121212]/60 p-7 backdrop-blur md:col-span-2"
                    >
                        <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
                            <div className="flex items-start gap-4">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/80">
                                    <BookOpen className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-white">{__('contact.docs.title')}</h2>
                                    <p className="mt-1 max-w-md text-sm leading-relaxed text-white/60">
                                        {__('contact.docs.description')}
                                    </p>
                                </div>
                            </div>
                            <a
                                href="/docs"
                                className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition-colors hover:border-white/30 hover:bg-white/10"
                            >
                                <MessageCircle className="h-4 w-4" /> {__('contact.docs.button')}
                            </a>
                        </div>
                    </motion.div>
                </div>
            </section>
        </MainLayout>
    );
}
