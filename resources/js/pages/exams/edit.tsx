import { Head, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import ExamBuilder from './_exam-builder';
import type { Exam } from '@/types';

interface GuildRole {
    id: string;
    name: string;
    color?: string;
}

interface EditProps {
    exam: Exam;
    guild_roles: Record<string, GuildRole>;
}

export default function Edit({ exam, guild_roles }: EditProps) {
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

    // Convert DB models to ExamBuilder structure
    const initial_data = {
        name: exam.name,
        description: exam.description ?? '',
        required_roles: exam.required_roles ?? [],
        max_attempts: exam.max_attempts ?? '',
        min_percent: exam.min_percent,
        is_visible: exam.is_visible,
        auto_grade: exam.auto_grade,
        time_limit: exam.time_limit ?? '',
        settings: exam.settings ?? { passed_roles: [] },
        questions: (exam.questions ?? []).map((q) => ({
            id: q.id,
            type: q.type,
            points: q.points,
            time_limit: q.time_limit ?? '',
            order: q.order,
            content: q.content,
        })),
    };

    return (
        <AppLayout>
            <Head title={`${__('exam.edit_title')}: ${exam.name}`} />

            <div className="animate-fade-in container mx-auto space-y-8 p-6">
                <div>
                    <h1 className="bg-gradient-to-r from-primary to-indigo-400 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent">
                        {__('exam.edit_title')}
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {__('exam.edit_desc')}
                    </p>
                </div>

                <ExamBuilder
                    guild_roles={guild_roles}
                    initial_data={initial_data as any}
                    submit_url={route('exams.update', exam.id)}
                    method="put"
                />
            </div>
        </AppLayout>
    );
}
