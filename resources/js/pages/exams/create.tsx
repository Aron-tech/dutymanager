import { Head, usePage } from '@inertiajs/react';
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
    const { props } = usePage();

    const __ = (
        key: string,
        replace: Record<string, string | number> = {},
    ): string => {
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
            translation = translation.replace(
                `:${token}`,
                String(replace[token]),
            );
        });

        return translation;
    };

    return (
        <AppLayout>
            <Head title={__('exam.create_title')} />

            <div className="animate-fade-in container mx-auto space-y-8 p-6">
                <div>
                    <h1 className="bg-gradient-to-r from-primary to-indigo-400 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent">
                        {__('exam.create_title')}
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {__('exam.create_desc')}
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
