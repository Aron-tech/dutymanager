import { Head, Link, router } from '@inertiajs/react';
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
    EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
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

    const hasRequiredRoles = (exam: Exam) => {
        if (is_admin) return true;
        if (!exam.required_roles || exam.required_roles.length === 0) return true;
        return exam.required_roles.some((role) => user_roles.includes(role));
    };

    const handleDelete = () => {
        if (!deleting_exam) return;
        setIsDeleting(true);
        router.delete(route('exams.destroy', deleting_exam.id), {
            onSuccess: () => setDeletingExam(null),
            onFinish: () => setIsDeleting(false)
        });
    };

    return (
        <AppLayout>
            <Head title="Vizsgák" />

            <div className="container mx-auto p-6 max-w-7xl space-y-8 animate-fade-in">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/40 pb-6">
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-indigo-400 bg-clip-text text-transparent">
                            Vizsgarendszer
                        </h1>
                        <p className="text-muted-foreground mt-1 text-sm">
                            Töltsd ki az elérhető vizsgákat a rangod növeléséhez, vagy hozz létre újakat adminisztrátorként.
                        </p>
                    </div>

                    {is_admin && (
                        <Button asChild className="shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-300 gap-2">
                            <Link href={route('exams.create')}>
                                <Plus className="h-4 w-4" />
                                Új vizsga létrehozása
                            </Link>
                        </Button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {exams.length === 0 ? (
                        <div className="col-span-full py-16 text-center border-2 border-dashed border-muted rounded-xl flex flex-col items-center justify-center space-y-4">
                            <BookOpen className="h-12 w-12 text-muted-foreground/60" />
                            <h3 className="font-semibold text-lg text-foreground">Nincsenek elérhető vizsgák</h3>
                            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                                Jelenleg egyetlen vizsga sincs közzétéve a guildben.
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
                                            ? 'opacity-80 border-border bg-card/50'
                                            : 'border-border/60 bg-gradient-to-br from-card to-background'
                                    }`}
                                >
                                    {!exam.is_visible && (
                                        <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-yellow-500/10 text-yellow-500 text-xs px-2.5 py-1 rounded-full font-medium border border-yellow-500/20">
                                            <EyeOff className="h-3.5 w-3.5" />
                                            Rejtett
                                        </div>
                                    )}

                                    <CardHeader className="space-y-2 pb-4">
                                        <div className="flex justify-between items-start gap-4">
                                            <Badge variant={is_locked ? 'secondary' : 'default'} className="uppercase text-[10px] tracking-wider font-semibold">
                                                {is_locked ? 'Zárolt' : 'Elérhető'}
                                            </Badge>
                                            <div className="flex items-center text-xs text-muted-foreground gap-1.5">
                                                <Clock className="h-3.5 w-3.5 text-primary/70" />
                                                {exam.time_limit ? `${Math.round(exam.time_limit / 60)} perc` : 'Nincs időkorlát'}
                                            </div>
                                        </div>

                                        <CardTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
                                            {exam.name}
                                            {is_locked && <Lock className="h-4 w-4 text-destructive" />}
                                        </CardTitle>

                                        <CardDescription className="line-clamp-2 min-h-[40px] text-xs">
                                            {exam.description || 'Nincs leírás megadva.'}
                                        </CardDescription>
                                    </CardHeader>

                                    <CardContent className="space-y-4 pb-6 flex-grow">
                                        <div className="grid grid-cols-2 gap-4 text-xs bg-muted/30 p-3 rounded-lg border border-border/40">
                                            <div>
                                                <p className="text-muted-foreground">Kérdések</p>
                                                <p className="font-semibold text-sm text-foreground">{exam.questions?.length || 0} db</p>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground">Sikeres szint</p>
                                                <p className="font-semibold text-sm text-foreground">{exam.min_percent}%</p>
                                            </div>
                                        </div>

                                        {exam.required_roles && exam.required_roles.length > 0 && (
                                            <div className="space-y-1.5">
                                                <p className="text-[11px] font-medium text-muted-foreground">Szükséges rangok:</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {exam.required_roles.map((role_id) => (
                                                        <Badge key={role_id} variant="outline" className="text-[10px] bg-background/50 border-border/60">
                                                            Rang: {role_id}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>

                                    <CardFooter className="pt-0 border-t border-border/20 p-6 flex justify-between gap-4 mt-auto">
                                        <div className="flex gap-2">
                                            {is_admin && (
                                                <>
                                                    <Button asChild variant="outline" size="icon" className="hover:bg-primary/10 transition-colors">
                                                        <Link href={route('exams.edit', exam.id)}>
                                                            <Pencil className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className="text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors"
                                                        onClick={() => setDeletingExam(exam)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </>
                                            )}
                                        </div>

                                        <Button asChild disabled={is_locked} className="flex-grow max-w-[160px] shadow-sm">
                                            <Link href={route('exams.show', exam.id)}>
                                                {is_locked ? 'Zárolva' : 'Megtekintés'}
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
                title="Vizsga törlése"
                description={`Biztosan törölni szeretnéd a(z) "${deleting_exam?.name}" vizsgát? Ez a művelet végleges.`}
                isLoading={is_deleting}
            />
        </AppLayout>
    );
}
