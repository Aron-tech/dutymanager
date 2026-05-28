import React from 'react';

interface legal_page_props {
    title: string;
    last_updated: string;
    children: React.ReactNode;
}

export default function LegalPage({ title, last_updated, children }: legal_page_props) {
    return (
        <section className="px-4 pt-32 pb-24 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl">
                <header className="border-b border-white/10 pb-8">
                    <span className="font-mono text-xs font-semibold uppercase tracking-widest text-[#4B9BFF]">Legal</span>
                    <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-white">{title}</h1>
                    <p className="mt-3 text-sm text-white/45">Last updated: {last_updated}</p>
                </header>

                <article
                    className="prose prose-invert mt-10 max-w-none
                        prose-headings:scroll-mt-24 prose-headings:font-bold prose-headings:tracking-tight
                        prose-h2:mt-10 prose-h2:text-xl prose-h2:text-white
                        prose-h3:text-lg prose-h3:text-white/90
                        prose-p:text-white/65 prose-p:leading-relaxed
                        prose-li:text-white/65 prose-li:marker:text-[#4B9BFF]
                        prose-strong:text-white prose-a:text-[#4B9BFF] prose-a:no-underline hover:prose-a:underline"
                >
                    {children}
                </article>
            </div>
        </section>
    );
}
