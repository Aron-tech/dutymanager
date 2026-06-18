import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import ExamBuilder from './_exam-builder';

interface GuildRole {
    id: string;
    name: string;
    color?: string;
}

interface CreateProps {
    guild_roles: Record<string, GuildRole>;
}

export default function Create({ guild_roles }: CreateProps) {
    return (
        <AppLayout>
            <Head title="Új vizsga létrehozása" />

            <div className="container mx-auto p-6 max-w-5xl space-y-8 animate-fade-in">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-indigo-400 bg-clip-text text-transparent">
                        Új vizsga létrehozása
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Állítsd össze a vizsgát, adj hozzá kérdéseket és állítsd be a sikeres teljesítéshez szükséges feltételeket.
                    </p>
                </div>

                <ExamBuilder
                    guild_roles={guild_roles}
                    submit_url={route('exams.store')}
                    method="post"
                />
            </div>
        </AppLayout>
    );
}
