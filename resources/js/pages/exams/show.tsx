import { Head, Link, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import {
    BookOpen,
    Clock,
    CheckCircle2,
    XCircle,
    Play,
    ChevronLeft,
    ChevronRight,
    AlertTriangle,
    ShieldCheck,
    History
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import type { Exam, ExamAttempt } from '@/types';

interface ShowProps {
    exam: Exam;
    is_admin: boolean;
}

export default function Show({ exam, is_admin }: ShowProps) {
    const [is_running, setIsRunning] = useState(false);
    const [time_left, setTimeLeft] = useState<number | null>(null);
    const [user_answers, setUserAnswers] = useState<Record<number, any>>({});
    const [current_idx, setCurrentIdx] = useState(0);

    const { data, setData, post, processing } = useForm({
        answers: {} as Record<number, any>
    });

    const attempts_count = exam.attempts?.length ?? 0;
    const latest_attempt = exam.attempts?.[0] ?? null;
    const has_attempts_left = exam.max_attempts === null || attempts_count < exam.max_attempts;

    // Timer Effect
    useEffect(() => {
        if (!is_running || time_left === null) return;

        if (time_left <= 0) {
            submitExam();
            return;
        }

        const timer = setTimeout(() => {
            setTimeLeft(time_left - 1);
        }, 1000);

        return () => clearTimeout(timer);
    }, [is_running, time_left]);

    const startExam = () => {
        setIsRunning(true);
        if (exam.time_limit) {
            setTimeLeft(exam.time_limit * 60);
        }
        // Initialize default empty answers for matching or multiple choice
        const initial_answers: Record<number, any> = {};
        exam.questions?.forEach((q) => {
            if (q.type === 'matching' || q.type === 'cloze') {
                initial_answers[q.id] = {};
            } else if (q.type === 'true_false') {
                initial_answers[q.id] = null;
            } else if (q.type === 'multiple_choice') {
                const has_correct_options = q.content?.correct_options !== undefined;
                initial_answers[q.id] = has_correct_options ? [] : '';
            } else {
                initial_answers[q.id] = '';
            }
        });
        setUserAnswers(initial_answers);
        setData('answers', initial_answers);
    };

    const handleMultipleChoiceChange = (question_id: number, opt_idx: number, opt_text: string, is_multiple: boolean) => {
        const current_ans = user_answers[question_id];
        
        if (is_multiple) {
            const current_arr = Array.isArray(current_ans) ? current_ans : [];
            const idx_str = String(opt_idx);
            const next_arr = current_arr.includes(idx_str)
                ? current_arr.filter((val: string) => val !== idx_str)
                : [...current_arr, idx_str];
            handleAnswerChange(question_id, next_arr);
        } else {
            const question = exam.questions?.find(q => q.id === question_id);
            const has_correct_options = question?.content?.correct_options !== undefined;
            if (has_correct_options) {
                handleAnswerChange(question_id, [String(opt_idx)]);
            } else {
                handleAnswerChange(question_id, opt_text);
            }
        }
    };

    const handleAnswerChange = (question_id: number, val: any) => {
        const updated = {
            ...user_answers,
            [question_id]: val
        };
        setUserAnswers(updated);
        setData('answers', updated);
    };

    const handleMatchingChange = (question_id: number, left_item: string, val: string) => {
        const current_match = user_answers[question_id] ?? {};
        const updated_match = {
            ...current_match,
            [left_item]: val
        };
        handleAnswerChange(question_id, updated_match);
    };

    const handleClozeChange = (question_id: number, blank_idx: number, val: string) => {
        const current_cloze = user_answers[question_id] ?? {};
        const updated_cloze = {
            ...current_cloze,
            [blank_idx]: val
        };
        handleAnswerChange(question_id, updated_cloze);
    };

    const submitExam = () => {
        post(route('exams.submit', exam.id), {
            onSuccess: () => {
                setIsRunning(false);
            }
        });
    };

    const formatTime = (sec: number) => {
        const mins = Math.floor(sec / 60);
        const secs = sec % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const renderRunner = () => {
        const question = exam.questions?.[current_idx];
        if (!question) return null;

        const total_questions = exam.questions?.length ?? 0;

        return (
            <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
                {/* Timer Header */}
                <div className="flex justify-between items-center bg-card border border-border/60 p-4 rounded-xl shadow-md">
                    <div className="space-y-0.5">
                        <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Vizsga folyamatban</span>
                        <h2 className="text-lg font-bold text-foreground">{exam.name}</h2>
                    </div>

                    <div className="flex items-center gap-3 bg-primary/10 border border-primary/20 text-primary px-4 py-2 rounded-lg font-mono font-bold text-lg">
                        <Clock className="h-5 w-5 animate-pulse" />
                        {time_left !== null ? formatTime(time_left) : 'Nincs időkorlát'}
                    </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                    <div
                        className="bg-primary h-full transition-all duration-300"
                        style={{ width: `${((current_idx + 1) / total_questions) * 100}%` }}
                    />
                </div>

                {/* Question Card */}
                <Card className="border-border/60 bg-gradient-to-br from-card to-background shadow-lg">
                    <CardHeader className="space-y-4 pb-4">
                        <div className="flex justify-between items-center">
                            <Badge className="font-mono text-xs">
                                Kérdés: {current_idx + 1} / {total_questions}
                            </Badge>
                            <Badge variant="outline" className="text-[11px]">
                                {question.points} pont
                            </Badge>
                        </div>
                        <CardTitle className="text-xl font-semibold leading-relaxed">
                            {question.content.question_text}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 pb-8 min-h-[200px]">
                        {/* Multiple Choice Option */}
                        {question.type === 'multiple_choice' && (() => {
                            const is_multiple = Array.isArray(question.content.correct_options) && question.content.correct_options.length > 1;
                            
                            if (is_multiple) {
                                return (
                                    <div className="space-y-3">
                                        <p className="text-xs text-muted-foreground mb-2">Több helyes válasz is kijelölhető.</p>
                                        {(question.content.options ?? []).map((opt: string, opt_idx: number) => {
                                            const isChecked = Array.isArray(user_answers[question.id]) && user_answers[question.id].includes(String(opt_idx));
                                            return (
                                                <div
                                                    key={opt_idx}
                                                    className={`flex items-center space-x-3 p-4 rounded-lg border transition-all cursor-pointer hover:bg-muted/30 ${
                                                        isChecked
                                                            ? 'border-primary bg-primary/5 shadow-sm'
                                                            : 'border-border/60'
                                                    }`}
                                                    onClick={() => handleMultipleChoiceChange(question.id, opt_idx, opt, true)}
                                                >
                                                    <Checkbox
                                                        id={`opt-${opt_idx}`}
                                                        checked={isChecked}
                                                        onCheckedChange={() => handleMultipleChoiceChange(question.id, opt_idx, opt, true)}
                                                    />
                                                    <Label htmlFor={`opt-${opt_idx}`} className="flex-grow cursor-pointer font-medium text-foreground">
                                                        {opt}
                                                    </Label>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            }

                            return (
                                <RadioGroup
                                    value={Array.isArray(user_answers[question.id]) ? user_answers[question.id][0] : user_answers[question.id] ?? ''}
                                    onValueChange={(val) => {
                                        const opt_idx = (question.content.options ?? []).indexOf(val);
                                        handleMultipleChoiceChange(question.id, opt_idx, val, false);
                                    }}
                                    className="space-y-3"
                                >
                                    {(question.content.options ?? []).map((opt: string, opt_idx: number) => {
                                        const isChecked = (Array.isArray(user_answers[question.id]) && user_answers[question.id].includes(String(opt_idx))) || user_answers[question.id] === opt;
                                        return (
                                            <div
                                                key={opt_idx}
                                                className={`flex items-center space-x-3 p-4 rounded-lg border transition-all cursor-pointer hover:bg-muted/30 ${
                                                    isChecked
                                                        ? 'border-primary bg-primary/5 shadow-sm'
                                                        : 'border-border/60'
                                                }`}
                                                onClick={() => handleMultipleChoiceChange(question.id, opt_idx, opt, false)}
                                            >
                                                <RadioGroupItem value={opt} id={`opt-${opt_idx}`} checked={isChecked} />
                                                <Label htmlFor={`opt-${opt_idx}`} className="flex-grow cursor-pointer font-medium text-foreground">
                                                    {opt}
                                                </Label>
                                            </div>
                                        );
                                    })}
                                </RadioGroup>
                            );
                        })()}

                        {/* True/False Option */}
                        {question.type === 'true_false' && (
                            <div className="flex gap-4 max-w-sm mx-auto justify-center mt-6">
                                <Button
                                    type="button"
                                    variant={user_answers[question.id] === true ? 'default' : 'outline'}
                                    className="w-full py-8 text-lg font-bold"
                                    onClick={() => handleAnswerChange(question.id, true)}
                                >
                                    IGAZ
                                </Button>
                                <Button
                                    type="button"
                                    variant={user_answers[question.id] === false ? 'default' : 'outline'}
                                    className="w-full py-8 text-lg font-bold"
                                    onClick={() => handleAnswerChange(question.id, false)}
                                >
                                    HAMIS
                                </Button>
                            </div>
                        )}

                        {/* Matching Option */}
                        {question.type === 'matching' && (
                            <div className="space-y-4 max-w-xl mx-auto mt-4 bg-muted/20 p-4 rounded-xl border border-border/40">
                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                                    Párosítsd a bal oldali elemeket a jobb oldaliakkal!
                                </span>
                                {(question.content.left_items ?? []).map((left: string, left_idx: number) => (
                                    <div key={left_idx} className="flex items-center gap-3">
                                        <span className="text-sm font-semibold min-w-[150px] truncate">{left}</span>
                                        <span className="text-muted-foreground">&rarr;</span>
                                        <Select
                                            value={user_answers[question.id]?.[left] ?? ''}
                                            onValueChange={(val) => handleMatchingChange(question.id, left, val)}
                                        >
                                            <SelectTrigger className="flex-grow bg-background">
                                                <SelectValue placeholder="Válassz párt" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {(question.content.right_items ?? []).map((right: string, right_idx: number) => (
                                                    <SelectItem key={right_idx} value={right}>
                                                        {right}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Free Text Option */}
                        {question.type === 'free_text' && (
                            <div className="space-y-2 max-w-2xl mx-auto mt-4">
                                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                                    Írd be a választ!
                                </Label>
                                <Textarea
                                    value={user_answers[question.id] ?? ''}
                                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                                    placeholder="Ide írd a választ..."
                                    rows={4}
                                    className="bg-background"
                                />
                            </div>
                        )}

                        {/* Cloze (Fill-in-the-blanks) Option */}
                        {question.type === 'cloze' && (
                            <div className="space-y-4 max-w-2xl mx-auto mt-4 p-4 rounded-xl border border-border/40 bg-muted/10">
                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                                    Egészítsd ki a hiányzó szavakat a szövegben!
                                </span>
                                <div className="leading-loose text-foreground text-sm font-medium flex flex-wrap items-center gap-x-2 gap-y-3">
                                    {(question.content.question_text ?? '')
                                        .split(/(\[[^\]]+\])/)
                                        .map((part: string, part_idx: number) => {
                                            if (part_idx % 2 === 0) {
                                                return <span key={part_idx}>{part}</span>;
                                            }

                                            const blank_idx = (part_idx - 1) / 2;
                                            const correct_val = part.slice(1, -1);
                                            const wordCount = correct_val.trim().split(/\s+/).filter(Boolean).length;
                                            const widthClass = wordCount > 2 ? 'w-56' : wordCount > 1 ? 'w-44' : 'w-32';

                                            return (
                                                <Input
                                                    key={part_idx}
                                                    value={user_answers[question.id]?.[blank_idx] ?? ''}
                                                    onChange={(e) => handleClozeChange(question.id, blank_idx, e.target.value)}
                                                    placeholder={`(${wordCount > 1 ? `${wordCount} szó` : '1 szó'})`}
                                                    className={`inline-block ${widthClass} h-9 px-2 py-1 text-center bg-background border-primary/40 focus:border-primary`}
                                                />
                                            );
                                        })}
                                </div>
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="flex justify-between border-t border-border/20 p-6 bg-muted/10">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setCurrentIdx(current_idx - 1)}
                            disabled={current_idx === 0}
                        >
                            <ChevronLeft className="h-4 w-4 mr-2" /> Előző
                        </Button>

                        {current_idx < total_questions - 1 ? (
                            <Button type="button" onClick={() => setCurrentIdx(current_idx + 1)}>
                                Következő <ChevronRight className="h-4 w-4 ml-2" />
                            </Button>
                        ) : (
                            <Button type="button" onClick={submitExam} disabled={processing} className="bg-emerald-600 hover:bg-emerald-700 shadow-md">
                                {processing ? 'Beküldés...' : 'Vizsga befejezése'}
                            </Button>
                        )}
                    </CardFooter>
                </Card>
            </div>
        );
    };

    const renderDetails = () => {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto animate-fade-in">
                {/* Details Card */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-border/60 bg-gradient-to-br from-card to-background shadow-md">
                        <CardHeader className="space-y-2">
                            <div className="flex justify-between items-start gap-4">
                                <Badge className="uppercase tracking-wider text-[10px]">Vizsga részletei</Badge>
                                {exam.time_limit && (
                                    <div className="flex items-center text-xs text-muted-foreground gap-1.5">
                                        <Clock className="h-3.5 w-3.5" />
                                        {Math.round(exam.time_limit / 60)} perc
                                    </div>
                                )}
                            </div>
                            <CardTitle className="text-2xl font-bold">{exam.name}</CardTitle>
                            <CardDescription className="text-sm leading-relaxed">
                                {exam.description || 'Nincs leírás a vizsgához.'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 border-t border-border/20 pt-6">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="p-3 bg-muted/40 rounded-lg border border-border/40 text-center">
                                    <span className="text-xs text-muted-foreground block">Sikeres teljesítés</span>
                                    <span className="text-lg font-bold text-foreground">{exam.min_percent}%</span>
                                </div>
                                <div className="p-3 bg-muted/40 rounded-lg border border-border/40 text-center">
                                    <span className="text-xs text-muted-foreground block">Kérdések száma</span>
                                    <span className="text-lg font-bold text-foreground">{exam.questions?.length || 0} db</span>
                                </div>
                                <div className="p-3 bg-muted/40 rounded-lg border border-border/40 text-center">
                                    <span className="text-xs text-muted-foreground block">Próbálkozások</span>
                                    <span className="text-lg font-bold text-foreground">
                                        {attempts_count} / {exam.max_attempts ?? 'Végtelen'}
                                    </span>
                                </div>
                            </div>

                            {latest_attempt && (
                                <div className={`p-4 rounded-xl border flex items-center gap-4 ${
                                    latest_attempt.score !== null && latest_attempt.score >= exam.min_percent
                                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600'
                                        : 'bg-destructive/10 border-destructive/20 text-destructive'
                                }`}>
                                    {latest_attempt.score !== null && latest_attempt.score >= exam.min_percent ? (
                                        <>
                                            <ShieldCheck className="h-10 w-10 shrink-0" />
                                            <div>
                                                <h4 className="font-bold text-sm">Legutóbbi eredményed: Sikeres vizsga!</h4>
                                                <p className="text-xs mt-0.5 opacity-90">
                                                    Elért pontszám: {latest_attempt.score}%. A beállított jogosultságok sikeresen jóváírásra kerültek a discord fiókodon.
                                                </p>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <AlertTriangle className="h-10 w-10 shrink-0" />
                                            <div>
                                                <h4 className="font-bold text-sm">Legutóbbi eredményed: Sikertelen vizsga!</h4>
                                                <p className="text-xs mt-0.5 opacity-90">
                                                    Elért pontszám: {latest_attempt.score}%. Nem érted el a szükséges {exam.min_percent}% szintet.
                                                </p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="border-t border-border/20 pt-6 flex justify-between items-center gap-4">
                            <Button asChild variant="outline">
                                <Link href={route('exams.index')}>Vissza a listához</Link>
                            </Button>

                            <Button
                                onClick={startExam}
                                disabled={!has_attempts_left}
                                className="shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all font-bold gap-2 px-6"
                            >
                                <Play className="h-4 w-4" />
                                Vizsga indítása
                            </Button>
                        </CardFooter>
                    </Card>
                </div>

                {/* Side History Panel */}
                <div className="space-y-6">
                    <Card className="border-border/60 bg-gradient-to-br from-card to-background shadow-md">
                        <CardHeader className="pb-3 flex flex-row items-center gap-2">
                            <History className="h-5 w-5 text-primary" />
                            <CardTitle className="text-lg font-bold">Korábbi próbálkozásaid</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {exam.attempts?.length === 0 ? (
                                <p className="text-xs text-muted-foreground text-center py-6">Még nincs próbálkozásod ehhez a vizsgához.</p>
                            ) : (
                                <div className="space-y-3">
                                    {exam.attempts?.map((attempt: ExamAttempt, idx: number) => {
                                        const passed = attempt.score !== null && attempt.score >= exam.min_percent;
                                        return (
                                            <div key={attempt.id} className="flex justify-between items-center p-3 border border-border/60 bg-background/50 rounded-lg text-xs">
                                                <div className="space-y-0.5">
                                                    <span className="font-bold block text-foreground">#{exam.attempts!.length - idx}. Próbálkozás</span>
                                                    <span className="text-[10px] text-muted-foreground">
                                                        {new Date(attempt.created_at).toLocaleDateString('hu-HU')}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <Badge variant={passed ? 'default' : 'destructive'} className="font-bold">
                                                        {attempt.score}%
                                                    </Badge>
                                                    {passed ? (
                                                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                                    ) : (
                                                        <XCircle className="h-4 w-4 text-destructive" />
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    };

    return (
        <AppLayout>
            <Head title={exam.name} />

            <div className="container mx-auto p-6 max-w-7xl">
                {is_running ? renderRunner() : renderDetails()}
            </div>
        </AppLayout>
    );
}
