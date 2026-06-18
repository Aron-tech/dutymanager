import { Head } from '@inertiajs/react';
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
            content: q.content
        }))
    };

    return (
        <AppLayout>
            <Head title={`Vizsga szerkesztése: ${exam.name}`} />

            <div className="container mx-auto p-6 max-w-5xl space-y-8 animate-fade-in">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-indigo-400 bg-clip-text text-transparent">
                        Vizsga szerkesztése
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Módosítsd a vizsga paramétereit, adj hozzá vagy törölj kérdéseket a meglévő sablonból.
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
