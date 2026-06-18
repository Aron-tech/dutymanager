import { Head, Link, useForm } from '@inertiajs/react';
import {
    GraduationCap,
    Clock,
    User,
    CheckCircle2,
    XCircle,
    AlertCircle,
    ArrowLeft,
    Check,
    X,
    Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';

interface ExamQuestion {
    id: number;
    type: 'multiple_choice' | 'true_false' | 'matching' | 'free_text' | 'cloze';
    points: number;
    time_limit: number | null;
    order: number;
    content: {
        question_text?: string;
        options?: string[];
        correct_answer?: string;
        correct_options?: string[];
        correct_pairs?: Record<string, string>;
        left_items?: string[];
        right_items?: string[];
        correct_answers?: string[];
        correct?: boolean;
    };
}

interface ExamAttempt {
    id: number;
    exam_id: number;
    guild_id: string;
    user_id: string;
    score: number | null;
    status: string;
    created_at: string;
    data: {
        answers?: Record<number, any>;
    } | null;
    exam: {
        id: number;
        name: string;
        description: string;
        min_percent: number;
        questions: ExamQuestion[];
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

interface ShowProps {
    attempt: ExamAttempt;
}

export default function Show({ attempt }: ShowProps) {
    const { exam, user, guild_user } = attempt;
    const submittedAnswers = attempt.data?.answers ?? {};
    const userName = guild_user?.nickname || user.name;

    const { data, setData, post, processing, errors } = useForm({
        score: attempt.score ?? 0,
        status: attempt.status || 'pending',
    });

    // Auto-calculate current automated score for reference
    const calculateAutoScore = () => {
        let totalPoints = 0;
        let earnedPoints = 0;

        exam.questions.forEach((question) => {
            totalPoints += question.points;
            const submitted = submittedAnswers[question.id];
            if (submitted === undefined || submitted === null) return;

            let isCorrect = false;
            const content = question.content;

            switch (question.type) {
                case 'multiple_choice':
                    const correct_option = content.correct_answer ?? content.correct_options ?? null;
                    if (Array.isArray(correct_option)) {
                        if (Array.isArray(submitted)) {
                            const sortedCorrect = [...correct_option].sort();
                            const sortedSubmitted = [...submitted].sort();
                            isCorrect = JSON.stringify(sortedCorrect) === JSON.stringify(sortedSubmitted);
                        }
                    } else {
                        isCorrect = String(correct_option) === String(submitted);
                    }
                    break;

                case 'true_false':
                    const correctVal = content.correct ?? content.correct_answer;
                    isCorrect = String(correctVal) === String(submitted);
                    break;

                case 'matching':
                    const correctPairs = content.correct_pairs ?? {};
                    if (typeof submitted === 'object' && submitted !== null) {
                        let match = true;
                        const keys = Object.keys(correctPairs);
                        for (const key of keys) {
                            if (String(submitted[key]) !== String(correctPairs[key])) {
                                match = false;
                                break;
                            }
                        }
                        if (match && keys.length === Object.keys(submitted).length) {
                            isCorrect = true;
                        }
                    }
                    break;

                case 'free_text':
                    const correctAns = content.correct_answer;
                    if (correctAns && submitted) {
                        isCorrect = String(submitted).trim().toLowerCase() === String(correctAns).trim().toLowerCase();
                    }
                    break;

                case 'cloze':
                    const correctAnswers = content.correct_answers ?? [];
                    if (Array.isArray(correctAnswers) && typeof submitted === 'object' && submitted !== null) {
                        let match = true;
                        for (let i = 0; i < correctAnswers.length; i++) {
                            if (String(submitted[i]).trim().toLowerCase() !== String(correctAnswers[i]).trim().toLowerCase()) {
                                match = false;
                                break;
                            }
                        }
                        isCorrect = match;
                    }
                    break;
            }

            if (isCorrect) {
                earnedPoints += question.points;
            }
        });

        return totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    };

    const autoScore = calculateAutoScore();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('exams.attempts.grade', attempt.id));
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('hu-HU', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'graded': return 'Lejavítva';
            case 'failed': return 'Sikertelen';
            case 'pending': return 'Javításra vár';
            default: return status;
        }
    };

    return (
        <AppLayout>
            <Head title={`Javítás: ${userName} - ${exam.name}`} />

            <div className="container mx-auto p-6 max-w-6xl space-y-8 animate-fade-in">
                {/* Back button & Header */}
                <div className="space-y-4">
                    <Button asChild variant="ghost" className="gap-2">
                        <Link href={route('exams.attempts')}>
                            <ArrowLeft className="h-4 w-4" />
                            Vissza az eredményekhez
                        </Link>
                    </Button>
                    <div className="border-b border-border/40 pb-6">
                        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-indigo-400 bg-clip-text text-transparent">
                            Vizsga javítása
                        </h1>
                        <p className="text-muted-foreground mt-1 text-sm">
                            Vizsgázó: <span className="font-semibold text-foreground">{userName}</span> &bull;
                            Vizsga: <span className="font-semibold text-foreground">{exam.name}</span> &bull;
                            Dátum: <span className="font-semibold text-foreground">{formatDate(attempt.created_at)}</span>
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    {/* Left Column: Question reviews */}
                    <div className="lg:col-span-2 space-y-6">
                        <h2 className="text-xl font-bold text-foreground">Válaszok ellenőrzése</h2>

                        {exam.questions.map((question, idx) => {
                            const submitted = submittedAnswers[question.id];
                            const content = question.content;
                            
                            // Check correctness for rendering checkmarks
                            let isCorrect = false;
                            switch (question.type) {
                                case 'multiple_choice':
                                    const correct_option = content.correct_answer ?? content.correct_options ?? null;
                                    if (Array.isArray(correct_option)) {
                                        if (Array.isArray(submitted)) {
                                            isCorrect = JSON.stringify([...correct_option].sort()) === JSON.stringify([...submitted].sort());
                                        }
                                    } else {
                                        isCorrect = String(correct_option) === String(submitted);
                                    }
                                    break;
                                case 'true_false':
                                    isCorrect = String(content.correct ?? content.correct_answer) === String(submitted);
                                    break;
                                case 'matching':
                                    if (typeof submitted === 'object' && submitted !== null) {
                                        let match = true;
                                        const pairs = content.correct_pairs ?? {};
                                        Object.keys(pairs).forEach((key) => {
                                            if (String(submitted[key]) !== String(pairs[key])) match = false;
                                        });
                                        isCorrect = match && Object.keys(pairs).length === Object.keys(submitted).length;
                                    }
                                    break;
                                case 'free_text':
                                    isCorrect = String(submitted).trim().toLowerCase() === String(content.correct_answer).trim().toLowerCase();
                                    break;
                                case 'cloze':
                                    if (Array.isArray(content.correct_answers) && typeof submitted === 'object' && submitted !== null) {
                                        let match = true;
                                        content.correct_answers.forEach((ans, a_idx) => {
                                            if (String(submitted[a_idx]).trim().toLowerCase() !== String(ans).trim().toLowerCase()) match = false;
                                        });
                                        isCorrect = match;
                                    }
                                    break;
                            }

                            return (
                                <Card key={question.id} className={`border-border/60 ${isCorrect ? 'bg-green-500/5 hover:border-green-500/30' : 'bg-destructive/5 hover:border-destructive/30'} transition-all`}>
                                    <CardHeader className="pb-3 flex flex-row justify-between items-start gap-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <Badge className="font-mono text-xs">#{idx + 1}</Badge>
                                                <Badge variant="outline" className="capitalize text-[10px]">
                                                    {question.type === 'multiple_choice' ? 'Feleletválasztós' :
                                                     question.type === 'true_false' ? 'Igaz/Hamis' :
                                                     question.type === 'matching' ? 'Párosítás' :
                                                     question.type === 'free_text' ? 'Szabad szöveges' : 'Behelyettesítős'}
                                                </Badge>
                                                <Badge variant="secondary" className="text-[10px]">{question.points} pont</Badge>
                                            </div>
                                            <CardTitle className="text-base font-bold text-foreground mt-2">
                                                {content.question_text}
                                            </CardTitle>
                                        </div>
                                        <div className="shrink-0 mt-1">
                                            {isCorrect ? (
                                                <div className="h-6 w-6 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center text-green-500">
                                                    <Check className="h-4 w-4" />
                                                </div>
                                            ) : (
                                                <div className="h-6 w-6 rounded-full bg-destructive/15 border border-destructive/30 flex items-center justify-center text-destructive">
                                                    <X className="h-4 w-4" />
                                                </div>
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-3 text-sm">
                                        {/* Multiple Choice display */}
                                        {question.type === 'multiple_choice' && (
                                            <div className="space-y-2">
                                                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Opciók és válaszok:</p>
                                                {(content.options ?? []).map((opt: string, opt_idx: number) => {
                                                    const isCorrectOpt = Array.isArray(content.correct_options)
                                                        ? content.correct_options.includes(String(opt_idx))
                                                        : content.correct_answer === opt;
                                                    const isSubmittedOpt = Array.isArray(submitted)
                                                        ? submitted.includes(String(opt_idx))
                                                        : submitted === opt;

                                                    return (
                                                        <div
                                                            key={opt_idx}
                                                            className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs ${
                                                                isCorrectOpt && isSubmittedOpt
                                                                    ? 'bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400 font-semibold'
                                                                    : isSubmittedOpt
                                                                    ? 'bg-destructive/10 border-destructive/30 text-destructive font-semibold'
                                                                    : isCorrectOpt
                                                                    ? 'bg-green-500/5 border-green-500/20 text-green-600 dark:text-green-400 opacity-80'
                                                                    : 'bg-muted/10 border-border/40 opacity-70'
                                                            }`}
                                                        >
                                                            <Badge variant="outline" className="font-mono text-[10px]">{String.fromCharCode(65 + opt_idx)}</Badge>
                                                            <span className="flex-grow">{opt}</span>
                                                            <div className="flex gap-1.5 shrink-0">
                                                                {isCorrectOpt && <Badge className="bg-green-600 text-white text-[9px] px-1 py-0 hover:bg-green-600">Helyes</Badge>}
                                                                {isSubmittedOpt && <Badge variant="secondary" className="text-[9px] px-1 py-0">Jelölve</Badge>}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* True False display */}
                                        {question.type === 'true_false' && (
                                            <div className="grid grid-cols-2 gap-4 bg-muted/20 p-3 rounded-lg border border-border/40 text-xs">
                                                <div>
                                                    <span className="text-muted-foreground block">Helyes válasz:</span>
                                                    <span className="font-bold text-green-600 dark:text-green-400 uppercase">
                                                        {String(content.correct ?? content.correct_answer) === 'true' ? 'IGAZ' : 'HAMIS'}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground block">Beküldött válasz:</span>
                                                    <span className={`font-bold uppercase ${isCorrect ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>
                                                        {submitted === true || String(submitted) === 'true' ? 'IGAZ' : submitted === false || String(submitted) === 'false' ? 'HAMIS' : 'Nincs válasz'}
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Matching display */}
                                        {question.type === 'matching' && (
                                            <div className="space-y-2 bg-muted/20 p-3 rounded-lg border border-border/40 text-xs">
                                                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">Párosítások:</p>
                                                {(content.left_items ?? []).map((left: string, left_idx: number) => {
                                                    const correctVal = content.correct_pairs?.[left];
                                                    const submittedVal = submitted?.[left];
                                                    const isPairCorrect = String(correctVal) === String(submittedVal);

                                                    return (
                                                        <div key={left_idx} className="flex flex-wrap items-center gap-2 p-1.5 border-b border-border/40 last:border-0">
                                                            <span className="font-semibold text-foreground min-w-[120px]">{left}</span>
                                                            <span className="text-muted-foreground">&rarr;</span>
                                                            <span className="text-green-600 dark:text-green-400 font-medium">{correctVal}</span>
                                                            <span className="text-muted-foreground text-[10px]">(Beküldött: <span className={isPairCorrect ? 'text-green-600 dark:text-green-400 font-semibold' : 'text-destructive font-semibold'}>{submittedVal || 'hiányzik'}</span>)</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* Free Text display */}
                                        {question.type === 'free_text' && (
                                            <div className="space-y-3">
                                                <div className="p-3 bg-muted/30 rounded-lg border border-border/40">
                                                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block mb-1">Beküldött válasz:</span>
                                                    <p className={`font-medium ${isCorrect ? 'text-green-600 dark:text-green-400' : 'text-foreground'}`}>
                                                        {submitted || <span className="text-muted-foreground italic">Nem érkezett válasz</span>}
                                                    </p>
                                                </div>
                                                <div className="p-3 bg-green-500/5 rounded-lg border border-green-500/10">
                                                    <span className="text-[10px] text-green-600 dark:text-green-400 uppercase font-bold tracking-wider block mb-1">Elvárt (Helyes) válasz:</span>
                                                    <p className="font-semibold text-green-600 dark:text-green-400">
                                                        {content.correct_answer}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Cloze display */}
                                        {question.type === 'cloze' && (
                                            <div className="space-y-4">
                                                <div className="p-3 bg-muted/20 rounded-lg border border-border/40 leading-relaxed text-xs">
                                                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-2">Behelyettesített szöveg:</p>
                                                    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-2">
                                                        {(content.question_text ?? '')
                                                            .split(/(\[[^\]]+\])/)
                                                            .map((part: string, part_idx: number) => {
                                                                if (part_idx % 2 === 0) {
                                                                    return <span key={part_idx}>{part}</span>;
                                                                }

                                                                const blank_idx = (part_idx - 1) / 2;
                                                                const correctVal = part.slice(1, -1);
                                                                const userVal = submitted?.[blank_idx];
                                                                const isWordCorrect = String(userVal).trim().toLowerCase() === String(correctVal).trim().toLowerCase();

                                                                return (
                                                                    <span
                                                                        key={part_idx}
                                                                        className={`px-2 py-0.5 rounded border font-semibold inline-flex flex-col items-center ${
                                                                            isWordCorrect
                                                                                ? 'bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400'
                                                                                : 'bg-destructive/10 border-destructive/30 text-destructive'
                                                                        }`}
                                                                    >
                                                                        <span>{userVal || '___'}</span>
                                                                        {!isWordCorrect && (
                                                                            <span className="text-[9px] opacity-70 line-through">
                                                                                ({correctVal})
                                                                            </span>
                                                                        )}
                                                                    </span>
                                                                );
                                                            })}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    {/* Right Column: Grading form */}
                    <div className="lg:col-span-1 sticky top-6 space-y-6">
                        <h2 className="text-xl font-bold text-foreground">Értékelés</h2>

                        <Card className="border-border/60 bg-gradient-to-br from-card to-background shadow-lg">
                            <form onSubmit={handleSubmit}>
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                                        <GraduationCap className="h-4.5 w-4.5 text-primary" />
                                        Pontozás
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        Határozd meg a vizsga végső pontszámát és állapotát.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* Auto-grade hint */}
                                    <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-xs flex gap-2.5 items-start">
                                        <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-semibold text-primary">Rendszer általi pontozás</p>
                                            <p className="text-muted-foreground mt-0.5">
                                                Az automatikus javítás alapján számolt eredmény: <span className="font-bold text-foreground">{autoScore}%</span>.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Score input */}
                                    <div className="space-y-2">
                                        <Label htmlFor="score">Elért pontszám (%)</Label>
                                        <Input
                                            id="score"
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={data.score}
                                            onChange={(e) => setData('score', Number(e.target.value))}
                                            required
                                        />
                                        {errors.score && <p className="text-xs text-destructive">{errors.score}</p>}
                                    </div>

                                    {/* Status selection */}
                                    <div className="space-y-2">
                                        <Label htmlFor="status">Vizsga státusza</Label>
                                        <Select
                                            value={data.status}
                                            onValueChange={(val) => setData('status', val)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="pending">Javításra vár (Függőben)</SelectItem>
                                                <SelectItem value="graded">Lejavítva (Sikeres)</SelectItem>
                                                <SelectItem value="failed">Sikertelen</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {errors.status && <p className="text-xs text-destructive">{errors.status}</p>}
                                        <p className="text-[10px] text-muted-foreground">
                                            A státusz &quot;Lejavítva&quot;-ra állítása és a sikeres szint ({exam.min_percent}%) elérése után a vizsgázó automatikusan megkapja a rangjait.
                                        </p>
                                    </div>
                                </CardContent>
                                <CardFooter className="border-t border-border/20 pt-4 flex justify-between gap-3">
                                    <Button asChild type="button" variant="outline" size="sm">
                                        <Link href={route('exams.attempts')}>Mégse</Link>
                                    </Button>
                                    <Button type="submit" disabled={processing} size="sm" className="shadow-md shadow-primary/10">
                                        {processing ? 'Mentés...' : 'Értékelés mentése'}
                                    </Button>
                                </CardFooter>
                            </form>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
