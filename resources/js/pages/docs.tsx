import { Head, usePage } from '@inertiajs/react';
import { Search, Hash } from 'lucide-react';
import { useEffect, useState } from 'react';
import MainLayout from '@/layouts/main-layout';
import { doc_groups, doc_sections } from '@/data/docs-content';

const openSearch = () => window.dispatchEvent(new Event('open-docs-search'));

interface SharedPageProps {
    translations: Record<string, any>;
    [key: string]: any;
}

export default function Docs() {
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

    const [active_id, setActiveId] = useState(doc_sections[0]?.id ?? '');

    // Scrollspy: highlight the section currently in view.
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries
                    .filter((entry) => entry.isIntersecting)
                    .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

                if (visible[0]) {
                    setActiveId(visible[0].target.id);
                }
            },
            { rootMargin: '-96px 0px -65% 0px', threshold: 0 },
        );

        doc_sections.forEach((section) => {
            const node = document.getElementById(section.id);

            if (node) {
                observer.observe(node);
            }
        });

        return () => observer.disconnect();
    }, []);

    // Honor the #hash when arriving from the search modal.
    useEffect(() => {
        const hash = window.location.hash.replace('#', '');

        if (hash) {
            window.setTimeout(() => document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' }), 80);
        }
    }, []);

    const scrollTo = (id: string) => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
        window.history.replaceState(null, '', `#${id}`);
    };

    return (
        <MainLayout>
            <Head title={__('docs.meta.title')} />

            <div className="mx-auto flex w-full max-w-7xl gap-8 px-4 pt-24 pb-20 sm:px-6 lg:px-8">
                {/* LEFT SIDEBAR */}
                <aside className="sticky top-24 hidden h-[calc(100vh-7rem)] w-56 shrink-0 overflow-y-auto lg:block">
                    <button
                        type="button"
                        onClick={openSearch}
                        className="mb-6 flex w-full items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/40 transition-colors hover:border-white/20 hover:text-white/70"
                    >
                        <Search className="h-3.5 w-3.5" />
                        <span>{__('docs.search.button')}</span>
                        <kbd className="ml-auto rounded border border-white/10 bg-white/5 px-1.5 font-mono text-[10px] text-white/50">⌘K</kbd>
                    </button>

                    <nav className="flex flex-col gap-6">
                        {doc_groups.map((group) => (
                            <div key={group}>
                                <h3 className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-white/40">
                                    {group}
                                </h3>
                                <div className="flex flex-col gap-0.5">
                                    {doc_sections
                                        .filter((section) => section.group === group)
                                        .map((section) => (
                                            <button
                                                key={section.id}
                                                type="button"
                                                onClick={() => scrollTo(section.id)}
                                                className={`rounded-lg px-3 py-1.5 text-left text-sm transition-colors ${
                                                    active_id === section.id
                                                        ? 'bg-[#2A85FF]/15 font-medium text-[#4B9BFF]'
                                                        : 'text-white/60 hover:bg-white/5 hover:text-white'
                                                }`}
                                            >
                                                {section.title}
                                            </button>
                                        ))}
                                </div>
                            </div>
                        ))}
                    </nav>
                </aside>

                {/* CENTER CONTENT */}
                <main className="min-w-0 flex-1">
                    <div className="mb-10">
                        <span className="font-mono text-xs font-semibold uppercase tracking-widest text-[#4B9BFF]">
                            {__('docs.header.eyebrow')}
                        </span>
                        <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-white">{__('docs.header.title')}</h1>
                        <p className="mt-3 max-w-2xl text-pretty text-white/60">
                            {__('docs.header.subtitle_part_1')}
                            <kbd className="mx-1 rounded border border-white/10 bg-white/5 px-1.5 font-mono text-xs text-white/70">⌘K</kbd>
                            {__('docs.header.subtitle_part_2')}
                            <kbd className="mx-1 rounded border border-white/10 bg-white/5 px-1.5 font-mono text-xs text-white/70">Ctrl K</kbd>
                            {__('docs.header.subtitle_part_3')}
                        </p>
                    </div>

                    <div className="flex flex-col gap-16">
                        {doc_sections.map((section) => (
                            <section key={section.id} id={section.id} className="scroll-mt-24">
                                <h2 className="group flex items-center gap-2 text-2xl font-bold tracking-tight text-white">
                                    <button
                                        type="button"
                                        onClick={() => scrollTo(section.id)}
                                        className="opacity-0 transition-opacity group-hover:opacity-100"
                                        aria-label={`Link to ${section.title}`}
                                    >
                                        <Hash className="h-4 w-4 text-[#4B9BFF]" />
                                    </button>
                                    {section.title}
                                </h2>

                                {section.paragraphs?.map((paragraph, index) => (
                                    <p key={index} className="mt-4 leading-relaxed text-white/65">
                                        {paragraph}
                                    </p>
                                ))}

                                {section.commands && (
                                    <div className="mt-6 flex flex-col gap-4">
                                        {section.commands.map((command) => (
                                            <div
                                                key={command.signature}
                                                className="overflow-hidden rounded-xl border border-white/10 bg-[#121212]/60 backdrop-blur"
                                            >
                                                <div className="flex flex-wrap items-center gap-3 border-b border-white/10 bg-white/[0.03] px-5 py-3">
                                                    <code className="rounded-md bg-[#1A1A24] px-2.5 py-1 font-mono text-sm font-semibold text-[#FF4B4B]">
                                                        {command.signature}
                                                    </code>
                                                </div>
                                                <div className="px-5 py-4">
                                                    <p className="text-sm leading-relaxed text-white/70">{command.description}</p>

                                                    {command.options && command.options.length > 0 && (
                                                        <div className="mt-4 overflow-x-auto">
                                                            <table className="w-full min-w-[480px] border-collapse text-left text-sm">
                                                                <thead>
                                                                    <tr className="border-b border-white/10 text-[11px] uppercase tracking-wider text-white/40">
                                                                        <th className="py-2 pr-4 font-semibold">{__('docs.table.option')}</th>
                                                                        <th className="py-2 pr-4 font-semibold">{__('docs.table.type')}</th>
                                                                        <th className="py-2 pr-4 font-semibold">{__('docs.table.required')}</th>
                                                                        <th className="py-2 font-semibold">{__('docs.table.description')}</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {command.options.map((option) => (
                                                                        <tr key={option.name} className="border-b border-white/5 last:border-0">
                                                                            <td className="py-2.5 pr-4">
                                                                                <code className="font-mono text-[13px] text-[#4B9BFF]">{option.name}</code>
                                                                            </td>
                                                                            <td className="py-2.5 pr-4 text-white/60">{option.type}</td>
                                                                            <td className="py-2.5 pr-4">
                                                                                {option.required ? (
                                                                                    <span className="rounded-md bg-[#FF2A2A]/15 px-2 py-0.5 text-xs font-medium text-[#FF4B4B]">
                                                                                        {__('docs.table.required_yes')}
                                                                                    </span>
                                                                                ) : (
                                                                                    <span className="rounded-md bg-white/5 px-2 py-0.5 text-xs font-medium text-white/40">
                                                                                        {__('docs.table.required_no')}
                                                                                    </span>
                                                                                )}
                                                                            </td>
                                                                            <td className="py-2.5 text-white/60">{option.description}</td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>
                        ))}
                    </div>
                </main>

                {/* RIGHT TABLE OF CONTENTS */}
                <aside className="sticky top-24 hidden h-[calc(100vh-7rem)] w-52 shrink-0 overflow-y-auto xl:block">
                    <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-white/40">
                        {__('docs.toc.title')}
                    </h3>
                    <nav className="flex flex-col gap-1 border-l border-white/10">
                        {doc_sections.map((section) => (
                            <button
                                key={section.id}
                                type="button"
                                onClick={() => scrollTo(section.id)}
                                className={`-ml-px border-l-2 py-1 pl-4 text-left text-sm transition-colors ${
                                    active_id === section.id
                                        ? 'border-[#4B9BFF] font-medium text-[#4B9BFF]'
                                        : 'border-transparent text-white/50 hover:text-white'
                                }`}
                            >
                                {section.title}
                            </button>
                        ))}
                    </nav>
                </aside>
            </div>
        </MainLayout>
    );
}
