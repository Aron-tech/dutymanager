import { Head, Link } from '@inertiajs/react';
import {
    GraduationCap,
    Clock,
    User,
    CheckCircle2,
    XCircle,
    AlertCircle,
    ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';

interface ExamAttempt {
    id: number;
    exam_id: number;
    guild_id: string;
    user_id: string;
    score: number | null;
    status: string;
    created_at: string;
    exam: {
        id: number;
        name: string;
        min_percent: number;
    };
    user: {
        id: string;
        name: string;
        avatar?: string;
    };
    guild_user?: {
        nickname?: string;
    };
}

interface IndexProps {
    attempts: ExamAttempt[];
}

export default function Index({ attempts }: IndexProps) {
    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('hu-HU', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusBadge = (attempt: ExamAttempt) => {
        switch (attempt.status) {
            case 'graded':
                const passed = attempt.score !== null && attempt.score >= attempt.exam.min_percent;
                return (
                    <Badge variant={passed ? 'default' : 'destructive'} className="gap-1.5 py-1 px-2.5">
                        {passed ? (
                            <>
                                <CheckCircle2 className="h-3 w-3" />
                                Sikeres ({attempt.score}%)
                            </>
                        ) : (
                            <>
                                <XCircle className="h-3 w-3" />
                                Sikertelen ({attempt.score}%)
                            </>
                        )}
                    </Badge>
                );
            case 'failed':
                return (
                    <Badge variant="destructive" className="gap-1.5 py-1 px-2.5">
                        <XCircle className="h-3 w-3" />
                        Sikertelen
                    </Badge>
                );
            case 'pending':
            default:
                return (
                    <Badge variant="secondary" className="bg-yellow-500/10 hover:bg-yellow-500/15 text-yellow-500 border border-yellow-500/20 gap-1.5 py-1 px-2.5">
                        <AlertCircle className="h-3 w-3" />
                        Javításra vár
                    </Badge>
                );
        }
    };

    return (
        <AppLayout>
            <Head title="Vizsga eredmények" />

            <div className="container mx-auto p-6 max-w-6xl space-y-8 animate-fade-in">
                <div className="flex justify-between items-center border-b border-border/40 pb-6">
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-indigo-400 bg-clip-text text-transparent">
                            Vizsga eredmények
                        </h1>
                        <p className="text-muted-foreground mt-1 text-sm">
                            Tekintsd át és javítsd a felhasználók által beküldött vizsga kitöltéseket.
                        </p>
                    </div>
                </div>

                <Card className="border-border/60 bg-gradient-to-br from-card to-background shadow-lg">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <GraduationCap className="h-5 w-5 text-primary" />
                            Beküldött kitöltések
                        </CardTitle>
                        <CardDescription>
                            Az összes eddigi vizsgázás listája. Kattints a javítás gombra a kézi pontozáshoz és értékeléshez.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {attempts.length === 0 ? (
                            <div className="py-12 text-center border border-dashed border-muted rounded-lg flex flex-col items-center justify-center space-y-3">
                                <GraduationCap className="h-10 w-10 text-muted-foreground/60" />
                                <p className="text-sm font-medium text-foreground">Nincsenek beküldött vizsgák</p>
                                <p className="text-xs text-muted-foreground">Még senki sem töltött ki vizsgát ebben a guildben.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent border-b border-border/60">
                                            <TableHead>Felhasználó</TableHead>
                                            <TableHead>Vizsga</TableHead>
                                            <TableHead>Dátum</TableHead>
                                            <TableHead>Eredmény / Állapot</TableHead>
                                            <TableHead className="text-right">Műveletek</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {attempts.map((attempt) => {
                                            const userName = attempt.guild_user?.nickname || attempt.user.name;
                                            return (
                                                <TableRow key={attempt.id} className="border-b border-border/40 hover:bg-muted/10 transition-colors">
                                                    <TableCell className="font-medium">
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                                                                <User className="h-3.5 w-3.5" />
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-sm text-foreground">{userName}</p>
                                                                <p className="text-[10px] text-muted-foreground">ID: {attempt.user.id}</p>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="font-medium text-foreground">{attempt.exam.name}</span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                            <Clock className="h-3.5 w-3.5" />
                                                            {formatDate(attempt.created_at)}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {getStatusBadge(attempt)}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button asChild size="sm" variant="outline" className="gap-1 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all">
                                                            <Link href={route('exams.attempts.show', attempt.id)}>
                                                                Javítás
                                                                <ChevronRight className="h-3.5 w-3.5" />
                                                            </Link>
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
