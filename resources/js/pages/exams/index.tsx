import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import {
    BookOpen,
    Clock,
    Lock,
    Unlock,
    Plus,
    Pencil,
    Trash2,
    CheckCircle2,
    AlertCircle,
    EyeOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import type { Exam } from '@/types';

interface IndexProps {
    exams: Exam[];
    user_roles: string[];
    is_admin: boolean;
}

export default function Index({ exams, user_roles, is_admin }: IndexProps) {
    const [deleting_exam, setDeletingExam] = useState<Exam | null>(null);
    const [is_deleting, setIsDeleting] = useState(false);
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

    const hasRequiredRoles = (exam: Exam) => {
        if (is_admin) return true;
        if (!exam.required_roles || exam.required_roles.length === 0)
            return true;
        return exam.required_roles.some((role) => user_roles.includes(role));
    };

    const handleDelete = () => {
        if (!deleting_exam) return;
        setIsDeleting(true);
        router.delete(route('exams.destroy', deleting_exam.id), {
            onSuccess: () => setDeletingExam(null),
            onFinish: () => setIsDeleting(false),
        });
    };

    return (
        <AppLayout>
            <Head title={__('exam.title')} />

            <div className="animate-fade-in container mx-auto space-y-8 p-6">
                <div className="flex flex-col items-start justify-between gap-4 border-b border-border/40 pb-6 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="bg-gradient-to-r from-primary to-indigo-400 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent">
                            {__('exam.system_title')}
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {__('exam.description')}
                        </p>
                    </div>

                    {is_admin && (
                        <Button
                            asChild
                            className="gap-2 shadow-lg shadow-primary/20 transition-all duration-300 hover:shadow-primary/30"
                        >
                            <Link href={route('exams.create')}>
                                <Plus className="h-4 w-4" />
                                {__('exam.create_title')}
                            </Link>
                        </Button>
                    )}
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {exams.length === 0 ? (
                        <div className="col-span-full flex flex-col items-center justify-center space-y-4 rounded-xl border-2 border-dashed border-muted py-16 text-center">
                            <BookOpen className="h-12 w-12 text-muted-foreground/60" />
                            <h3 className="text-lg font-semibold text-foreground">
                                {__('exam.no_exams')}
                            </h3>
                            <p className="mx-auto max-w-xs text-sm text-muted-foreground">
                                {__('exam.no_exams_desc')}
                            </p>
                        </div>
                    ) : (
                        exams.map((exam) => {
                            const is_locked = !hasRequiredRoles(exam);
                            return (
                                <Card
                                    key={exam.id}
                                    className={`relative flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                                        is_locked
                                            ? 'border-border bg-card/50 opacity-80'
                                            : 'border-border/60 bg-gradient-to-br from-card to-background'
                                    }`}
                                >
                                    {!exam.is_visible && (
                                        <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full border border-yellow-500/20 bg-yellow-500/10 px-2.5 py-1 text-xs font-medium text-yellow-500">
                                            <EyeOff className="h-3.5 w-3.5" />
                                            {__('exam.hidden')}
                                        </div>
                                    )}

                                    <CardHeader className="space-y-2 pb-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <Badge
                                                variant={
                                                    is_locked
                                                        ? 'secondary'
                                                        : 'default'
                                                }
                                                className="text-[10px] font-semibold tracking-wider uppercase"
                                            >
                                                {is_locked
                                                    ? __('exam.locked')
                                                    : __('exam.available')}
                                            </Badge>
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                <Clock className="h-3.5 w-3.5 text-primary/70" />
                                                {exam.time_limit
                                                    ? `${exam.time_limit} ${__('exam.minutes')}`
                                                    : __('exam.no_time_limit')}
                                            </div>
                                        </div>

                                        <CardTitle className="flex items-center gap-2 text-xl font-bold text-foreground">
                                            {exam.name}
                                            {is_locked && (
                                                <Lock className="h-4 w-4 text-destructive" />
                                            )}
                                        </CardTitle>

                                        <CardDescription className="line-clamp-2 min-h-[40px] text-xs">
                                            {exam.description ||
                                                __('exam.no_description')}
                                        </CardDescription>
                                    </CardHeader>

                                    <CardContent className="flex-grow space-y-4 pb-6">
                                        <div className="grid grid-cols-2 gap-4 rounded-lg border border-border/40 bg-muted/30 p-3 text-xs">
                                            <div>
                                                <p className="text-muted-foreground">
                                                    {__('exam.questions_count')}
                                                </p>
                                                <p className="text-sm font-semibold text-foreground">
                                                    {exam.questions?.length ||
                                                        0}{' '}
                                                    db
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground">
                                                    {__('exam.min_percent')}
                                                </p>
                                                <p className="text-sm font-semibold text-foreground">
                                                    {exam.min_percent}%
                                                </p>
                                            </div>
                                        </div>

                                        {exam.required_roles &&
                                            exam.required_roles.length > 0 && (
                                                <div className="space-y-1.5">
                                                    <p className="text-[11px] font-medium text-muted-foreground">
                                                        {__(
                                                            'exam.required_roles',
                                                        )}
                                                        :
                                                    </p>
                                                    <div className="flex flex-wrap gap-1">
                                                        {exam.required_roles.map(
                                                            (role_id) => (
                                                                <Badge
                                                                    key={
                                                                        role_id
                                                                    }
                                                                    variant="outline"
                                                                    className="border-border/60 bg-background/50 text-[10px]"
                                                                >
                                                                    Rang:{' '}
                                                                    {role_id}
                                                                </Badge>
                                                            ),
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                    </CardContent>

                                    <CardFooter className="mt-auto flex justify-between gap-4 border-t border-border/20 p-6 pt-0">
                                        <div className="flex gap-2">
                                            {is_admin && (
                                                <>
                                                    <Button
                                                        asChild
                                                        variant="outline"
                                                        size="icon"
                                                        className="transition-colors hover:bg-primary/10"
                                                    >
                                                        <Link
                                                            href={route(
                                                                'exams.edit',
                                                                exam.id,
                                                            )}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className="text-destructive transition-colors hover:bg-destructive/10 hover:text-destructive"
                                                        onClick={() =>
                                                            setDeletingExam(
                                                                exam,
                                                            )
                                                        }
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </>
                                            )}
                                        </div>

                                        <Button
                                            asChild
                                            disabled={is_locked}
                                            className="max-w-[160px] flex-grow shadow-sm"
                                        >
                                            <Link
                                                href={route(
                                                    'exams.show',
                                                    exam.id,
                                                )}
                                            >
                                                {is_locked
                                                    ? __('exam.locked_btn')
                                                    : __('exam.view')}
                                            </Link>
                                        </Button>
                                    </CardFooter>
                                </Card>
                            );
                        })
                    )}
                </div>
            </div>

            <ConfirmDeleteDialog
                isOpen={deleting_exam !== null}
                onClose={() => setDeletingExam(null)}
                onConfirm={handleDelete}
                title={__('exam.delete_title')}
                description={__('exam.delete_confirm', {
                    name: deleting_exam?.name || '',
                })}
                isLoading={is_deleting}
            />
        </AppLayout>
    );
}
