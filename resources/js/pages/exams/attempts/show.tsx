import { Head, Link, useForm, usePage } from '@inertiajs/react';
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
    Info,
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
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
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
        achieved_points?: Record<number, number>;
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

    const isQuestionCorrect = (question: ExamQuestion) => {
        const submitted = submittedAnswers[question.id];
        if (submitted === undefined || submitted === null) return false;

        const content = question.content;
        let isCorrect = false;

        switch (question.type) {
            case 'multiple_choice':
                const correct_option =
                    content.correct_answer ?? content.correct_options ?? null;
                if (Array.isArray(correct_option)) {
                    if (Array.isArray(submitted)) {
                        const sortedCorrect = [...correct_option].sort();
                        const sortedSubmitted = [...submitted].sort();
                        isCorrect =
                            JSON.stringify(sortedCorrect) ===
                            JSON.stringify(sortedSubmitted);
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
                        if (
                            String(submitted[key]) !== String(correctPairs[key])
                        ) {
                            match = false;
                            break;
                        }
                    }
                    if (
                        match &&
                        keys.length === Object.keys(submitted).length
                    ) {
                        isCorrect = true;
                    }
                }
                break;

            case 'free_text':
                isCorrect = false;
                break;

            case 'cloze':
                const correctAnswers = content.correct_answers ?? [];
                if (
                    Array.isArray(correctAnswers) &&
                    typeof submitted === 'object' &&
                    submitted !== null
                ) {
                    let match = true;
                    for (let i = 0; i < correctAnswers.length; i++) {
                        if (
                            String(submitted[i]).trim().toLowerCase() !==
                            String(correctAnswers[i]).trim().toLowerCase()
                        ) {
                            match = false;
                            break;
                        }
                    }
                    isCorrect = match;
                }
                break;
        }

        return isCorrect;
    };

    // Auto-calculate current automated score for reference
    const calculateAutoScore = () => {
        let totalPoints = 0;
        let earnedPoints = 0;

        exam.questions.forEach((question) => {
            totalPoints += question.points;
            if (isQuestionCorrect(question)) {
                earnedPoints += question.points;
            }
        });

        return totalPoints > 0
            ? Math.round((earnedPoints / totalPoints) * 100)
            : 0;
    };

    const autoScore = calculateAutoScore();

    // Prefill achieved points
    const initialAchievedPoints: Record<number, number> = {};
    exam.questions.forEach((question) => {
        const savedPoints = attempt.data?.achieved_points?.[question.id];
        if (savedPoints !== undefined && savedPoints !== null) {
            initialAchievedPoints[question.id] = Number(savedPoints);
        } else {
            initialAchievedPoints[question.id] = isQuestionCorrect(question)
                ? question.points
                : 0;
        }
    });

    const { data, setData, post, processing, errors } = useForm({
        score: attempt.score ?? 0,
        status: attempt.status || 'pending',
        achieved_points: initialAchievedPoints,
    });

    const handlePointsChange = (questionId: number, val: number) => {
        const question = exam.questions.find((q) => q.id === questionId);
        const maxPoints = question?.points ?? 100;
        const boundedVal = Math.max(0, Math.min(maxPoints, val));

        const updatedPoints = {
            ...data.achieved_points,
            [questionId]: boundedVal,
        };

        let totalPoints = 0;
        let earnedPoints = 0;
        exam.questions.forEach((q) => {
            totalPoints += q.points;
            earnedPoints += updatedPoints[q.id] ?? 0;
        });

        const recalculatedScore =
            totalPoints > 0
                ? Math.round((earnedPoints / totalPoints) * 100)
                : 0;

        setData((prevData: any) => ({
            ...prevData,
            achieved_points: updatedPoints,
            score: recalculatedScore,
        }));
    };

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
            case 'graded':
                return __('exam.status_graded');
            case 'failed':
                return __('exam.status_failed');
            case 'pending':
                return __('exam.status_pending');
            default:
                return status;
        }
    };

    return (
        <AppLayout>
            <Head
                title={`${__('exam.grade_exam')}: ${userName} - ${exam.name}`}
            />

            <div className="animate-fade-in container mx-auto space-y-8 p-6">
                {/* Back button & Header */}
                <div className="space-y-4">
                    <Button asChild variant="ghost" className="gap-2">
                        <Link href={route('exams.attempts')}>
                            <ArrowLeft className="h-4 w-4" />
                            {__('exam.back_to_attempts')}
                        </Link>
                    </Button>
                    <div className="border-b border-border/40 pb-6">
                        <h1 className="bg-gradient-to-r from-primary to-indigo-400 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent">
                            {__('exam.grade_exam')}
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {__('exam.user')}:{' '}
                            <span className="font-semibold text-foreground">
                                {userName}
                            </span>{' '}
                            &bull;
                            {__('exam.title')}:{' '}
                            <span className="font-semibold text-foreground">
                                {exam.name}
                            </span>{' '}
                            &bull;
                            {__('exam.date')}:{' '}
                            <span className="font-semibold text-foreground">
                                {formatDate(attempt.created_at)}
                            </span>
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-3">
                    {/* Left Column: Question reviews */}
                    <div className="space-y-6 lg:col-span-2">
                        <h2 className="text-xl font-bold text-foreground">
                            {__('exam.check_answers')}
                        </h2>

                        {exam.questions.map((question, idx) => {
                            const submitted = submittedAnswers[question.id];
                            const content = question.content;
                            const currentPoints =
                                data.achieved_points[question.id] ?? 0;
                            const isFullyCorrect =
                                currentPoints === question.points;
                            const isPartiallyCorrect =
                                currentPoints > 0 &&
                                currentPoints < question.points;

                            return (
                                <Card
                                    key={question.id}
                                    className={`border-border/60 ${isFullyCorrect ? 'bg-green-500/5 hover:border-green-500/30' : isPartiallyCorrect ? 'bg-yellow-500/5 hover:border-yellow-500/30' : 'bg-destructive/5 hover:border-destructive/30'} transition-all`}
                                >
                                    <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <Badge className="font-mono text-xs">
                                                    #{idx + 1}
                                                </Badge>
                                                <Badge
                                                    variant="outline"
                                                    className="text-[10px] capitalize"
                                                >
                                                    {question.type ===
                                                    'multiple_choice'
                                                        ? __(
                                                              'exam.multiple_choice',
                                                          )
                                                        : question.type ===
                                                            'true_false'
                                                          ? __(
                                                                'exam.true_false',
                                                            )
                                                          : question.type ===
                                                              'matching'
                                                            ? __(
                                                                  'exam.matching',
                                                              )
                                                            : question.type ===
                                                                'free_text'
                                                              ? __(
                                                                    'exam.free_text',
                                                                )
                                                              : __(
                                                                    'exam.cloze',
                                                                )}
                                                </Badge>
                                                <Badge
                                                    variant="secondary"
                                                    className="text-[10px]"
                                                >
                                                    {question.points}{' '}
                                                    {__('exam.points')}
                                                </Badge>
                                            </div>
                                            <CardTitle className="mt-2 text-base leading-relaxed font-bold text-foreground">
                                                {content.question_text}
                                            </CardTitle>
                                        </div>
                                        <div className="mt-1 shrink-0">
                                            {isFullyCorrect ? (
                                                <div className="flex h-6 w-6 items-center justify-center rounded-full border border-green-500/30 bg-green-500/15 text-green-500">
                                                    <Check className="h-4 w-4" />
                                                </div>
                                            ) : isPartiallyCorrect ? (
                                                <div className="flex h-6 w-6 items-center justify-center rounded-full border border-yellow-500/30 bg-yellow-500/15 text-yellow-500">
                                                    <Info className="h-4 w-4" />
                                                </div>
                                            ) : (
                                                <div className="flex h-6 w-6 items-center justify-center rounded-full border border-destructive/30 bg-destructive/15 text-destructive">
                                                    <X className="h-4 w-4" />
                                                </div>
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-3 text-sm">
                                        {/* Multiple Choice display */}
                                        {question.type ===
                                            'multiple_choice' && (
                                            <div className="space-y-2">
                                                <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                                                    {__(
                                                        'exam.options_and_answers',
                                                    )}
                                                </p>
                                                {(content.options ?? []).map(
                                                    (
                                                        opt: string,
                                                        opt_idx: number,
                                                    ) => {
                                                        const isCorrectOpt =
                                                            Array.isArray(
                                                                content.correct_options,
                                                            )
                                                                ? content.correct_options.includes(
                                                                      String(
                                                                          opt_idx,
                                                                      ),
                                                                  )
                                                                : content.correct_answer ===
                                                                  opt;
                                                        const isSubmittedOpt =
                                                            Array.isArray(
                                                                submitted,
                                                            )
                                                                ? submitted.includes(
                                                                      String(
                                                                          opt_idx,
                                                                      ),
                                                                  )
                                                                : submitted ===
                                                                  opt;

                                                        return (
                                                            <div
                                                                key={opt_idx}
                                                                className={`flex items-center gap-2 rounded-lg border p-2.5 text-xs ${
                                                                    isCorrectOpt &&
                                                                    isSubmittedOpt
                                                                        ? 'border-green-500/30 bg-green-500/10 font-semibold text-green-600 dark:text-green-400'
                                                                        : isSubmittedOpt
                                                                          ? 'border-destructive/30 bg-destructive/10 font-semibold text-destructive'
                                                                          : isCorrectOpt
                                                                            ? 'border-green-500/20 bg-green-500/5 text-green-600 opacity-80 dark:text-green-400'
                                                                            : 'border-border/40 bg-muted/10 opacity-70'
                                                                }`}
                                                            >
                                                                <Badge
                                                                    variant="outline"
                                                                    className="font-mono text-[10px]"
                                                                >
                                                                    {String.fromCharCode(
                                                                        65 +
                                                                            opt_idx,
                                                                    )}
                                                                </Badge>
                                                                <span className="flex-grow">
                                                                    {opt}
                                                                </span>
                                                                <div className="flex shrink-0 gap-1.5">
                                                                    {isCorrectOpt && (
                                                                        <Badge className="bg-green-600 px-1 py-0 text-[9px] text-white hover:bg-green-600">
                                                                            {__(
                                                                                'exam.correct',
                                                                            )}
                                                                        </Badge>
                                                                    )}
                                                                    {isSubmittedOpt && (
                                                                        <Badge
                                                                            variant="secondary"
                                                                            className="px-1 py-0 text-[9px]"
                                                                        >
                                                                            {__(
                                                                                'exam.marked',
                                                                            )}
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    },
                                                )}
                                            </div>
                                        )}

                                        {/* True False display */}
                                        {question.type === 'true_false' && (
                                            <div className="grid grid-cols-2 gap-4 rounded-lg border border-border/40 bg-muted/20 p-3 text-xs">
                                                <div>
                                                    <span className="block text-muted-foreground">
                                                        {__(
                                                            'exam.expected_answer',
                                                        )}
                                                    </span>
                                                    <span className="font-bold text-green-600 uppercase dark:text-green-400">
                                                        {String(
                                                            content.correct ??
                                                                content.correct_answer,
                                                        ) === 'true'
                                                            ? __('exam.true')
                                                            : __('exam.false')}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="block text-muted-foreground">
                                                        {__(
                                                            'exam.submitted_answer',
                                                        )}
                                                    </span>
                                                    <span
                                                        className={`font-bold uppercase ${isQuestionCorrect(question) ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}
                                                    >
                                                        {submitted === true ||
                                                        String(submitted) ===
                                                            'true'
                                                            ? __('exam.true')
                                                            : submitted ===
                                                                    false ||
                                                                String(
                                                                    submitted,
                                                                ) === 'false'
                                                              ? __('exam.false')
                                                              : __(
                                                                    'exam.no_answer',
                                                                )}
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Matching display */}
                                        {question.type === 'matching' && (
                                            <div className="space-y-2 rounded-lg border border-border/40 bg-muted/20 p-3 text-xs">
                                                <p className="mb-1 text-xs font-bold tracking-wider text-muted-foreground uppercase">
                                                    {__('exam.matching_desc')}
                                                </p>
                                                {(content.left_items ?? []).map(
                                                    (
                                                        left: string,
                                                        left_idx: number,
                                                    ) => {
                                                        const correctVal =
                                                            content
                                                                .correct_pairs?.[
                                                                left
                                                            ];
                                                        const submittedVal =
                                                            submitted?.[left];
                                                        const isPairCorrect =
                                                            String(
                                                                correctVal,
                                                            ) ===
                                                            String(
                                                                submittedVal,
                                                            );

                                                        return (
                                                            <div
                                                                key={left_idx}
                                                                className="flex flex-wrap items-center gap-2 border-b border-border/40 p-1.5 last:border-0"
                                                            >
                                                                <span className="min-w-[120px] font-semibold text-foreground">
                                                                    {left}
                                                                </span>
                                                                <span className="text-muted-foreground">
                                                                    &rarr;
                                                                </span>
                                                                <span className="font-medium text-green-600 dark:text-green-400">
                                                                    {correctVal}
                                                                </span>
                                                                <span className="text-[10px] text-muted-foreground">
                                                                    (
                                                                    {__(
                                                                        'exam.submitted_answer',
                                                                    )}{' '}
                                                                    <span
                                                                        className={
                                                                            isPairCorrect
                                                                                ? 'font-semibold text-green-600 dark:text-green-400'
                                                                                : 'font-semibold text-destructive'
                                                                        }
                                                                    >
                                                                        {submittedVal ||
                                                                            __(
                                                                                'exam.no_answer',
                                                                            )}
                                                                    </span>
                                                                    )
                                                                </span>
                                                            </div>
                                                        );
                                                    },
                                                )}
                                            </div>
                                        )}

                                        {/* Free Text display */}
                                        {question.type === 'free_text' && (
                                            <div className="space-y-3 font-sans antialiased">
                                                <div className="rounded-xl border border-border/60 bg-muted/10 p-5 shadow-sm">
                                                    <span className="mb-2 block text-xs font-bold tracking-wider text-muted-foreground uppercase">
                                                        {__(
                                                            'exam.submitted_answer',
                                                        )}
                                                    </span>
                                                    <p className="text-sm leading-relaxed tracking-normal whitespace-pre-wrap text-foreground sm:text-base">
                                                        {submitted || (
                                                            <span className="text-muted-foreground italic">
                                                                {__(
                                                                    'exam.no_answer',
                                                                )}
                                                            </span>
                                                        )}
                                                    </p>
                                                </div>
                                                <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-5 shadow-sm">
                                                    <span className="mb-2 block text-xs font-bold tracking-wider text-green-600 uppercase dark:text-green-400">
                                                        {__(
                                                            'exam.expected_answer',
                                                        )}
                                                    </span>
                                                    <p className="text-sm leading-relaxed font-semibold tracking-normal whitespace-pre-wrap text-green-600 sm:text-base dark:text-green-400">
                                                        {content.correct_answer}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Cloze display */}
                                        {question.type === 'cloze' && (
                                            <div className="space-y-4">
                                                <div className="rounded-lg border border-border/40 bg-muted/20 p-3 text-xs leading-relaxed">
                                                    <p className="mb-2 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                                        {__('exam.cloze_text')}
                                                    </p>
                                                    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-2">
                                                        {(
                                                            content.question_text ??
                                                            ''
                                                        )
                                                            .split(
                                                                /(\[[^\]]+\])/,
                                                            )
                                                            .map(
                                                                (
                                                                    part: string,
                                                                    part_idx: number,
                                                                ) => {
                                                                    if (
                                                                        part_idx %
                                                                            2 ===
                                                                        0
                                                                    ) {
                                                                        return (
                                                                            <span
                                                                                key={
                                                                                    part_idx
                                                                                }
                                                                            >
                                                                                {
                                                                                    part
                                                                                }
                                                                            </span>
                                                                        );
                                                                    }

                                                                    const blank_idx =
                                                                        (part_idx -
                                                                            1) /
                                                                        2;
                                                                    const correctVal =
                                                                        part.slice(
                                                                            1,
                                                                            -1,
                                                                        );
                                                                    const userVal =
                                                                        submitted?.[
                                                                            blank_idx
                                                                        ];
                                                                    const isWordCorrect =
                                                                        String(
                                                                            userVal,
                                                                        )
                                                                            .trim()
                                                                            .toLowerCase() ===
                                                                        String(
                                                                            correctVal,
                                                                        )
                                                                            .trim()
                                                                            .toLowerCase();

                                                                    return (
                                                                        <span
                                                                            key={
                                                                                part_idx
                                                                            }
                                                                            className={`inline-flex flex-col items-center rounded border px-2 py-0.5 font-semibold ${
                                                                                isWordCorrect
                                                                                    ? 'border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400'
                                                                                    : 'border-destructive/30 bg-destructive/10 text-destructive'
                                                                            }`}
                                                                        >
                                                                            <span>
                                                                                {userVal ||
                                                                                    '___'}
                                                                            </span>
                                                                            {!isWordCorrect && (
                                                                                <span className="text-[9px] line-through opacity-70">
                                                                                    (
                                                                                    {
                                                                                        correctVal
                                                                                    }

                                                                                    )
                                                                                </span>
                                                                            )}
                                                                        </span>
                                                                    );
                                                                },
                                                            )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Question grading point input */}
                                        <div className="mt-4 flex max-w-xs items-center gap-2 border-t border-border/20 pt-4">
                                            <Label
                                                htmlFor={`points-${question.id}`}
                                                className="text-xs font-semibold whitespace-nowrap"
                                            >
                                                {__('exam.achieved_points')}
                                            </Label>
                                            <Input
                                                id={`points-${question.id}`}
                                                type="number"
                                                min="0"
                                                max={question.points}
                                                step="any"
                                                value={
                                                    data.achieved_points[
                                                        question.id
                                                    ] ?? 0
                                                }
                                                onChange={(e) =>
                                                    handlePointsChange(
                                                        question.id,
                                                        Number(e.target.value),
                                                    )
                                                }
                                                className="h-8 w-20 bg-background text-center"
                                            />
                                            <span className="text-xs text-muted-foreground">
                                                / {question.points}{' '}
                                                {__('exam.points')}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    {/* Right Column: Grading form */}
                    <div className="sticky top-6 space-y-6 lg:col-span-1">
                        <h2 className="text-xl font-bold text-foreground">
                            {__('exam.grading')}
                        </h2>

                        <Card className="border-border/60 bg-gradient-to-br from-card to-background shadow-lg">
                            <form onSubmit={handleSubmit}>
                                <CardHeader className="pb-4">
                                    <CardTitle className="flex items-center gap-2 text-sm font-bold">
                                        <GraduationCap className="h-4.5 w-4.5 text-primary" />
                                        {__('exam.grading')}
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        {__('exam.grading_desc')}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* Auto-grade hint */}
                                    <div className="flex items-start gap-2.5 rounded-lg border border-primary/20 bg-primary/10 p-3 text-xs">
                                        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                                        <div>
                                            <p className="font-semibold text-primary">
                                                {__('exam.auto_score_title')}
                                            </p>
                                            <p className="mt-0.5 text-muted-foreground">
                                                {__('exam.auto_score_desc', {
                                                    score: autoScore,
                                                })}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Score input (disabled as it is derived from individual questions) */}
                                    <div className="space-y-2">
                                        <Label htmlFor="score">
                                            {__('exam.achieved_score_label')}
                                        </Label>
                                        <Input
                                            id="score"
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={data.score}
                                            disabled
                                            className="bg-muted font-mono font-semibold text-muted-foreground"
                                        />
                                        {errors.score && (
                                            <p className="text-xs text-destructive">
                                                {errors.score}
                                            </p>
                                        )}
                                        <p className="text-[10px] text-muted-foreground">
                                            Ez a százalékos pontszám
                                            automatikusan frissül a kérdések
                                            szerzett pontjai alapján.
                                        </p>
                                    </div>

                                    {/* Status selection */}
                                    <div className="space-y-2">
                                        <Label htmlFor="status">
                                            {__('exam.exam_status_label')}
                                        </Label>
                                        <Select
                                            value={data.status}
                                            onValueChange={(val) =>
                                                setData('status', val)
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="pending">
                                                    {__('exam.status_pending')}
                                                </SelectItem>
                                                <SelectItem value="graded">
                                                    {__('exam.status_graded')}
                                                </SelectItem>
                                                <SelectItem value="failed">
                                                    {__('exam.status_failed')}
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {errors.status && (
                                            <p className="text-xs text-destructive">
                                                {errors.status}
                                            </p>
                                        )}
                                        <p className="text-[10px] text-muted-foreground">
                                            {__('exam.status_help', {
                                                percent: exam.min_percent,
                                            })}
                                        </p>
                                    </div>
                                </CardContent>
                                <CardFooter className="flex justify-between gap-3 border-t border-border/20 pt-4">
                                    <Button
                                        asChild
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                    >
                                        <Link href={route('exams.attempts')}>
                                            {__('exam.cancel')}
                                        </Link>
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        size="sm"
                                        className="shadow-md shadow-primary/10"
                                    >
                                        {processing
                                            ? __('exam.saving')
                                            : __('exam.save_grading')}
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
