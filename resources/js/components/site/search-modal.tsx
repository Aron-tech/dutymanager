import { Command } from 'cmdk';
import { router, usePage } from '@inertiajs/react';
import { FileText, TerminalSquare, Search } from 'lucide-react';
import { useEffect } from 'react';

interface search_modal_props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function SearchModal({ open, onOpenChange }: search_modal_props) {
    const { props } = usePage<any>();
    const doc_sections = props.translations?.docs?.sections ?? [];

    const __ = (key: string): string => {
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

        return typeof translation === 'string' ? translation : key;
    };

    // Close on Escape is handled by the overlay click + key listener below.
    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onOpenChange(false);
            }
        };

        if (open) {
            document.addEventListener('keydown', onKeyDown);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', onKeyDown);
            document.body.style.overflow = '';
        };
    }, [open, onOpenChange]);

    const goToSection = (section_id: string) => {
        onOpenChange(false);
        router.visit(`/docs#${section_id}`);
    };

    if (!open) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-[12vh]">
            <button
                type="button"
                aria-label="Close search"
                onClick={() => onOpenChange(false)}
                className="absolute inset-0 cursor-default bg-black/70 backdrop-blur-sm"
            />

            <Command
                loop
                className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-[#121212]/95 shadow-[0_0_60px_rgba(42,133,255,0.18)] backdrop-blur-xl"
            >
                <div className="flex items-center gap-3 border-b border-white/10 px-4">
                    <Search className="h-4 w-4 shrink-0 text-[#4B9BFF]" />
                    <Command.Input
                        autoFocus
                        placeholder={__('docs.search.placeholder')}
                        className="h-14 w-full bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
                    />
                    <kbd className="hidden shrink-0 rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-white/50 sm:block">
                        ESC
                    </kbd>
                </div>

                <Command.List className="max-h-[60vh] overflow-y-auto p-2">
                    <Command.Empty className="py-10 text-center text-sm text-white/40">
                        {__('docs.search.no_results')}
                    </Command.Empty>

                    <Command.Group
                        heading={__('docs.search.pages')}
                        className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-white/40 [&_[cmdk-group-items]]:mt-1"
                    >
                        {doc_sections.map((section: any) => (
                            <Command.Item
                                key={section.id}
                                value={`${section.title} ${section.summary}`}
                                onSelect={() => goToSection(section.id)}
                                className="flex cursor-pointer items-start gap-3 rounded-lg px-3 py-2.5 text-sm text-white/80 data-[selected=true]:bg-[#2A85FF]/15 data-[selected=true]:text-white"
                            >
                                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-[#4B9BFF]" />
                                <span className="flex flex-col">
                                    <span className="font-medium">{section.title}</span>
                                    <span className="text-xs text-white/40">{section.summary}</span>
                                </span>
                            </Command.Item>
                        ))}
                    </Command.Group>

                    <Command.Group
                        heading={__('docs.search.commands')}
                        className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-white/40 [&_[cmdk-group-items]]:mt-1"
                    >
                        {doc_sections.flatMap((section: any) =>
                            (section.commands ?? []).map((command: any) => (
                                <Command.Item
                                    key={`${section.id}-${command.signature}`}
                                    value={`${command.signature} ${command.description}`}
                                    onSelect={() => goToSection(section.id)}
                                    className="flex cursor-pointer items-start gap-3 rounded-lg px-3 py-2.5 text-sm text-white/80 data-[selected=true]:bg-[#FF2A2A]/15 data-[selected=true]:text-white"
                                >
                                    <TerminalSquare className="mt-0.5 h-4 w-4 shrink-0 text-[#FF4B4B]" />
                                    <span className="flex flex-col">
                                        <span className="font-mono text-[13px] font-medium">{command.signature}</span>
                                        <span className="text-xs text-white/40">{command.description}</span>
                                    </span>
                                </Command.Item>
                            )),
                        )}
                    </Command.Group>
                </Command.List>
            </Command>
        </div>
    );
}
