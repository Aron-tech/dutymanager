import { Head, Link, useForm, router, usePage } from '@inertiajs/react';
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
    History,
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import type { Exam, ExamAttempt } from '@/types';
import axios from 'axios';

interface ShowProps {
    exam: Exam;
    is_admin: boolean;
    active_attempt?: ExamAttempt | null;
}

export default function Show({ exam, is_admin, active_attempt }: ShowProps) {
    const { props } = usePage();
    const [is_running, setIsRunning] = useState(false);
    const [time_left, setTimeLeft] = useState<number | null>(null);
    const [user_answers, setUserAnswers] = useState<Record<number, any>>({});
    const [current_idx, setCurrentIdx] = useState(0);
    const [question_time_left, setQuestionTimeLeft] = useState<number | null>(
        null,
    );
    const [active_attempt_state, setActiveAttemptState] =
        useState<ExamAttempt | null>(active_attempt || null);

    const { data, setData, post, processing } = useForm({
        answers: {} as Record<number, any>,
    });

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

    const attempts_count = exam.attempts?.length ?? 0;
    const latest_attempt = exam.attempts?.[0] ?? null;
    const has_attempts_left =
        exam.max_attempts === null || attempts_count < exam.max_attempts;

    // Sync active_attempt prop to state
    useEffect(() => {
        if (active_attempt) {
            setActiveAttemptState(active_attempt);
        }
    }, [active_attempt]);

    // Resume active attempt on mount
    useEffect(() => {
        if (active_attempt) {
            const timeLimitSeconds = exam.time_limit
                ? exam.time_limit * 60
                : null;
            let remainingSeconds: number | null = null;
            if (timeLimitSeconds) {
                const elapsedSeconds = Math.floor(
                    (Date.now() -
                        new Date(active_attempt.created_at).getTime()) /
                        1000,
                );
                remainingSeconds = Math.max(
                    0,
                    timeLimitSeconds - elapsedSeconds,
                );
                if (remainingSeconds <= 0) {
                    return;
                }
            }

            setIsRunning(true);
            setTimeLeft(remainingSeconds);

            const savedAnswers = active_attempt.data?.answers ?? {};
            setUserAnswers(savedAnswers);
            setData('answers', savedAnswers);

            const savedIdx = active_attempt.data?.current_idx ?? 0;
            setCurrentIdx(savedIdx);

            const question = exam.questions?.[savedIdx];
            if (question && question.time_limit) {
                const startedAt =
                    active_attempt.data?.current_question_started_at;
                if (startedAt) {
                    const elapsedOnQuestion = Math.floor(
                        (Date.now() - new Date(startedAt).getTime()) / 1000,
                    );
                    const qTimeLeft = Math.max(
                        0,
                        question.time_limit - elapsedOnQuestion,
                    );
                    setQuestionTimeLeft(qTimeLeft);
                } else {
                    setQuestionTimeLeft(question.time_limit);
                }
            } else {
                setQuestionTimeLeft(null);
            }
        }
    }, [active_attempt]);

    // Global Timer Effect
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

    // Question-level Timer Effect
    useEffect(() => {
        if (!is_running || question_time_left === null) return;

        if (question_time_left <= 0) {
            handleQuestionTimeout();
            return;
        }

        const qTimer = setTimeout(() => {
            setQuestionTimeLeft(question_time_left - 1);
        }, 1000);

        return () => clearTimeout(qTimer);
    }, [is_running, question_time_left]);

    const handleQuestionTimeout = () => {
        const total_questions = exam.questions?.length ?? 0;
        if (current_idx < total_questions - 1) {
            navigateQuestion(current_idx + 1);
        } else {
            submitExam();
        }
    };

    const autosaveAttempt = (
        updatedAnswers: Record<number, any>,
        nextIdx: number,
        nextQuestionStartedAt: string,
    ) => {
        if (!active_attempt_state) return;
        axios
            .post(route('exams.attempts.save', active_attempt_state.id), {
                answers: updatedAnswers,
                current_idx: nextIdx,
                current_question_started_at: nextQuestionStartedAt,
            })
            .catch((err) => {
                console.error('Autosave error:', err);
            });
    };

    const startExam = () => {
        router.post(
            route('exams.start', exam.id),
            {},
            {
                onSuccess: () => {
                    // Backend will create starting attempt and redirect back, triggering resumption
                },
            },
        );
    };

    const navigateQuestion = (nextIdx: number) => {
        setCurrentIdx(nextIdx);
        const nextQuestion = exam.questions?.[nextIdx];
        const nextStartedAt = new Date().toISOString();
        if (nextQuestion && nextQuestion.time_limit) {
            setQuestionTimeLeft(nextQuestion.time_limit);
        } else {
            setQuestionTimeLeft(null);
        }

        if (active_attempt_state) {
            setActiveAttemptState((prev) =>
                prev
                    ? {
                          ...prev,
                          data: {
                              ...prev.data,
                              current_idx: nextIdx,
                              current_question_started_at: nextStartedAt,
                          },
                      }
                    : null,
            );
            autosaveAttempt(user_answers, nextIdx, nextStartedAt);
        }
    };

    const handleMultipleChoiceChange = (
        question_id: number,
        opt_idx: number,
        opt_text: string,
        is_multiple: boolean,
    ) => {
        const current_ans = user_answers[question_id];

        if (is_multiple) {
            const current_arr = Array.isArray(current_ans) ? current_ans : [];
            const idx_str = String(opt_idx);
            const next_arr = current_arr.includes(idx_str)
                ? current_arr.filter((val: string) => val !== idx_str)
                : [...current_arr, idx_str];
            handleAnswerChange(question_id, next_arr);
        } else {
            const question = exam.questions?.find((q) => q.id === question_id);
            const has_correct_options =
                question?.content?.correct_options !== undefined;
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
            [question_id]: val,
        };
        setUserAnswers(updated);
        setData('answers', updated);

        const startedAt =
            active_attempt_state?.data?.current_question_started_at ||
            new Date().toISOString();
        autosaveAttempt(updated, current_idx, startedAt);
    };

    const handleMatchingChange = (
        question_id: number,
        left_item: string,
        val: string,
    ) => {
        const current_match = user_answers[question_id] ?? {};
        const updated_match = {
            ...current_match,
            [left_item]: val,
        };
        handleAnswerChange(question_id, updated_match);
    };

    const handleClozeChange = (
        question_id: number,
        blank_idx: number,
        val: string,
    ) => {
        const current_cloze = user_answers[question_id] ?? {};
        const updated_cloze = {
            ...current_cloze,
            [blank_idx]: val,
        };
        handleAnswerChange(question_id, updated_cloze);
    };

    const submitExam = () => {
        post(route('exams.submit', exam.id), {
            onSuccess: () => {
                setIsRunning(false);
                setQuestionTimeLeft(null);
                setActiveAttemptState(null);
            },
        });
    };

    const formatTime = (sec: number) => {
        const mins = Math.floor(sec / 60);
        const secs = sec % 60;
        return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const renderRunner = () => {
        const question = exam.questions?.[current_idx];
        if (!question) return null;

        const total_questions = exam.questions?.length ?? 0;

        return (
            <div className="animate-fade-in w-full space-y-8">
                {/* Timer Header */}
                <div className="flex items-center justify-between rounded-xl border border-border/60 bg-card p-4 shadow-md">
                    <div className="space-y-0.5">
                        <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                            {__('exam.exam_in_progress')}
                        </span>
                        <h2 className="text-lg font-bold text-foreground">
                            {exam.name}
                        </h2>
                    </div>

                    <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/10 px-4 py-2 font-mono text-lg font-bold text-primary">
                        <Clock className="h-5 w-5 animate-pulse" />
                        {time_left !== null
                            ? formatTime(time_left)
                            : __('exam.no_time_limit')}
                    </div>
                </div>

                {/* Progress bar */}
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{
                            width: `${((current_idx + 1) / total_questions) * 100}%`,
                        }}
                    />
                </div>

                {/* Question Card */}
                <Card className="border-border/60 bg-gradient-to-br from-card to-background shadow-lg">
                    <CardHeader className="space-y-4 pb-4">
                        <div className="flex items-center justify-between">
                            <Badge className="font-mono text-xs">
                                {__('exam.question')}: {current_idx + 1} /{' '}
                                {total_questions}
                            </Badge>
                            <div className="flex gap-2">
                                {question_time_left !== null && (
                                    <Badge
                                        variant="secondary"
                                        className="animate-pulse font-mono text-xs text-red-500"
                                    >
                                        {__('exam.question_timer')}:{' '}
                                        {formatTime(question_time_left)}
                                    </Badge>
                                )}
                                <Badge
                                    variant="outline"
                                    className="text-[11px]"
                                >
                                    {question.points} {__('exam.points')}
                                </Badge>
                            </div>
                        </div>
                        <CardTitle className="text-xl leading-relaxed font-semibold">
                            {question.content.question_text}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="min-h-[200px] pt-4 pb-8">
                        {/* Multiple Choice Option */}
                        {question.type === 'multiple_choice' &&
                            (() => {
                                const is_multiple =
                                    Array.isArray(
                                        question.content.correct_options,
                                    ) &&
                                    question.content.correct_options.length > 1;

                                if (is_multiple) {
                                    return (
                                        <div className="space-y-3">
                                            <p className="mb-2 text-xs text-muted-foreground">
                                                {__(
                                                    'exam.multiple_choice_help',
                                                )}
                                            </p>
                                            {(
                                                question.content.options ?? []
                                            ).map(
                                                (
                                                    opt: string,
                                                    opt_idx: number,
                                                ) => {
                                                    const isChecked =
                                                        Array.isArray(
                                                            user_answers[
                                                                question.id
                                                            ],
                                                        ) &&
                                                        user_answers[
                                                            question.id
                                                        ].includes(
                                                            String(opt_idx),
                                                        );
                                                    return (
                                                        <div
                                                            key={opt_idx}
                                                            className={`flex cursor-pointer items-center space-x-3 rounded-lg border p-4 transition-all hover:bg-muted/30 ${
                                                                isChecked
                                                                    ? 'border-primary bg-primary/5 shadow-sm'
                                                                    : 'border-border/60'
                                                            }`}
                                                            onClick={() =>
                                                                handleMultipleChoiceChange(
                                                                    question.id,
                                                                    opt_idx,
                                                                    opt,
                                                                    true,
                                                                )
                                                            }
                                                        >
                                                            <Checkbox
                                                                id={`opt-${opt_idx}`}
                                                                checked={
                                                                    isChecked
                                                                }
                                                                onCheckedChange={() =>
                                                                    handleMultipleChoiceChange(
                                                                        question.id,
                                                                        opt_idx,
                                                                        opt,
                                                                        true,
                                                                    )
                                                                }
                                                            />
                                                            <Label
                                                                htmlFor={`opt-${opt_idx}`}
                                                                className="flex-grow cursor-pointer font-medium text-foreground"
                                                            >
                                                                {opt}
                                                            </Label>
                                                        </div>
                                                    );
                                                },
                                            )}
                                        </div>
                                    );
                                }

                                return (
                                    <RadioGroup
                                        value={
                                            Array.isArray(
                                                user_answers[question.id],
                                            )
                                                ? user_answers[question.id][0]
                                                : (user_answers[question.id] ??
                                                  '')
                                        }
                                        onValueChange={(val) => {
                                            const opt_idx = (
                                                question.content.options ?? []
                                            ).indexOf(val);
                                            handleMultipleChoiceChange(
                                                question.id,
                                                opt_idx,
                                                val,
                                                false,
                                            );
                                        }}
                                        className="space-y-3"
                                    >
                                        {(question.content.options ?? []).map(
                                            (opt: string, opt_idx: number) => {
                                                const isChecked =
                                                    (Array.isArray(
                                                        user_answers[
                                                            question.id
                                                        ],
                                                    ) &&
                                                        user_answers[
                                                            question.id
                                                        ].includes(
                                                            String(opt_idx),
                                                        )) ||
                                                    user_answers[
                                                        question.id
                                                    ] === opt;
                                                return (
                                                    <div
                                                        key={opt_idx}
                                                        className={`flex cursor-pointer items-center space-x-3 rounded-lg border p-4 transition-all hover:bg-muted/30 ${
                                                            isChecked
                                                                ? 'border-primary bg-primary/5 shadow-sm'
                                                                : 'border-border/60'
                                                        }`}
                                                        onClick={() =>
                                                            handleMultipleChoiceChange(
                                                                question.id,
                                                                opt_idx,
                                                                opt,
                                                                false,
                                                            )
                                                        }
                                                    >
                                                        <RadioGroupItem
                                                            value={opt}
                                                            id={`opt-${opt_idx}`}
                                                            checked={isChecked}
                                                        />
                                                        <Label
                                                            htmlFor={`opt-${opt_idx}`}
                                                            className="flex-grow cursor-pointer font-medium text-foreground"
                                                        >
                                                            {opt}
                                                        </Label>
                                                    </div>
                                                );
                                            },
                                        )}
                                    </RadioGroup>
                                );
                            })()}

                        {/* True/False Option */}
                        {question.type === 'true_false' && (
                            <div className="mx-auto mt-6 flex max-w-sm justify-center gap-4">
                                <Button
                                    type="button"
                                    variant={
                                        user_answers[question.id] === true
                                            ? 'default'
                                            : 'outline'
                                    }
                                    className="w-full py-8 text-lg font-bold"
                                    onClick={() =>
                                        handleAnswerChange(question.id, true)
                                    }
                                >
                                    {__('exam.true')}
                                </Button>
                                <Button
                                    type="button"
                                    variant={
                                        user_answers[question.id] === false
                                            ? 'default'
                                            : 'outline'
                                    }
                                    className="w-full py-8 text-lg font-bold"
                                    onClick={() =>
                                        handleAnswerChange(question.id, false)
                                    }
                                >
                                    {__('exam.false')}
                                </Button>
                            </div>
                        )}

                        {/* Matching Option */}
                        {question.type === 'matching' && (
                            <div className="mx-auto mt-4 max-w-xl space-y-4 rounded-xl border border-border/40 bg-muted/20 p-4">
                                <span className="mb-2 block text-xs font-bold tracking-wider text-muted-foreground uppercase">
                                    {__('exam.matching_desc')}
                                </span>
                                {(question.content.left_items ?? []).map(
                                    (left: string, left_idx: number) => (
                                        <div
                                            key={left_idx}
                                            className="flex items-center gap-3"
                                        >
                                            <span className="min-w-[150px] truncate text-sm font-semibold">
                                                {left}
                                            </span>
                                            <span className="text-muted-foreground">
                                                &rarr;
                                            </span>
                                            <Select
                                                value={
                                                    user_answers[question.id]?.[
                                                        left
                                                    ] ?? ''
                                                }
                                                onValueChange={(val) =>
                                                    handleMatchingChange(
                                                        question.id,
                                                        left,
                                                        val,
                                                    )
                                                }
                                            >
                                                <SelectTrigger className="flex-grow bg-background">
                                                    <SelectValue
                                                        placeholder={__(
                                                            'exam.matching_placeholder',
                                                        )}
                                                    />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {(
                                                        question.content
                                                            .right_items ?? []
                                                    ).map(
                                                        (
                                                            right: string,
                                                            right_idx: number,
                                                        ) => (
                                                            <SelectItem
                                                                key={right_idx}
                                                                value={right}
                                                            >
                                                                {right}
                                                            </SelectItem>
                                                        ),
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    ),
                                )}
                            </div>
                        )}

                        {/* Free Text Option */}
                        {question.type === 'free_text' && (
                            <div className="mx-auto mt-4 max-w-2xl space-y-2">
                                <Label className="mb-2 block text-xs font-bold tracking-wider text-muted-foreground uppercase">
                                    {__('exam.free_text_label')}
                                </Label>
                                <Textarea
                                    value={user_answers[question.id] ?? ''}
                                    onChange={(e) =>
                                        handleAnswerChange(
                                            question.id,
                                            e.target.value,
                                        )
                                    }
                                    placeholder={__(
                                        'exam.free_text_placeholder',
                                    )}
                                    rows={4}
                                    className="bg-background"
                                />
                            </div>
                        )}

                        {/* Cloze (Fill-in-the-blanks) Option */}
                        {question.type === 'cloze' && (
                            <div className="mx-auto mt-4 max-w-2xl space-y-4 rounded-xl border border-border/40 bg-muted/10 p-4">
                                <span className="mb-2 block text-xs font-bold tracking-wider text-muted-foreground uppercase">
                                    {__('exam.cloze_desc')}
                                </span>
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-3 text-sm leading-loose font-medium text-foreground">
                                    {(question.content.question_text ?? '')
                                        .split(/(\[[^\]]+\])/)
                                        .map(
                                            (
                                                part: string,
                                                part_idx: number,
                                            ) => {
                                                if (part_idx % 2 === 0) {
                                                    return (
                                                        <span key={part_idx}>
                                                            {part}
                                                        </span>
                                                    );
                                                }

                                                const blank_idx =
                                                    (part_idx - 1) / 2;
                                                const correct_val = part.slice(
                                                    1,
                                                    -1,
                                                );
                                                const wordCount = correct_val
                                                    .trim()
                                                    .split(/\s+/)
                                                    .filter(Boolean).length;
                                                const widthClass =
                                                    wordCount > 2
                                                        ? 'w-56'
                                                        : wordCount > 1
                                                          ? 'w-44'
                                                          : 'w-32';

                                                return (
                                                    <Input
                                                        key={part_idx}
                                                        value={
                                                            user_answers[
                                                                question.id
                                                            ]?.[blank_idx] ?? ''
                                                        }
                                                        onChange={(e) =>
                                                            handleClozeChange(
                                                                question.id,
                                                                blank_idx,
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder={`(${wordCount > 1 ? `${wordCount} ${__('exam.words')}` : `1 ${__('exam.word')}`})`}
                                                        className={`inline-block ${widthClass} h-9 border-primary/40 bg-background px-2 py-1 text-center focus:border-primary`}
                                                    />
                                                );
                                            },
                                        )}
                                </div>
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="flex justify-between border-t border-border/20 bg-muted/10 p-6">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigateQuestion(current_idx - 1)}
                            disabled={
                                current_idx === 0 ||
                                exam.questions?.[current_idx - 1]
                                    ?.time_limit !== null
                            }
                        >
                            <ChevronLeft className="mr-2 h-4 w-4" />{' '}
                            {__('exam.prev')}
                        </Button>

                        {current_idx < total_questions - 1 ? (
                            <Button
                                type="button"
                                onClick={() =>
                                    navigateQuestion(current_idx + 1)
                                }
                            >
                                {__('exam.next')}{' '}
                                <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                onClick={submitExam}
                                disabled={processing}
                                className="bg-emerald-600 shadow-md hover:bg-emerald-700"
                            >
                                {processing
                                    ? __('exam.submitting')
                                    : __('exam.finish_exam')}
                            </Button>
                        )}
                    </CardFooter>
                </Card>
            </div>
        );
    };

    const renderDetails = () => {
        return (
            <div className="animate-fade-in grid w-full grid-cols-1 gap-8 lg:grid-cols-3">
                {/* Details Card */}
                <div className="space-y-6 lg:col-span-2">
                    <Card className="border-border/60 bg-gradient-to-br from-card to-background shadow-md">
                        <CardHeader className="space-y-2">
                            <div className="flex items-start justify-between gap-4">
                                <Badge className="text-[10px] tracking-wider uppercase">
                                    {__('exam.details_badge')}
                                </Badge>
                                {exam.time_limit && (
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <Clock className="h-3.5 w-3.5" />
                                        {exam.time_limit} {__('exam.minutes')}
                                    </div>
                                )}
                            </div>
                            <CardTitle className="text-2xl font-bold">
                                {exam.name}
                            </CardTitle>
                            <CardDescription className="text-sm leading-relaxed">
                                {exam.description || __('exam.no_description')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 border-t border-border/20 pt-6">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                <div className="rounded-lg border border-border/40 bg-muted/40 p-3 text-center">
                                    <span className="block text-xs text-muted-foreground">
                                        {__('exam.min_percent')}
                                    </span>
                                    <span className="text-lg font-bold text-foreground">
                                        {exam.min_percent}%
                                    </span>
                                </div>
                                <div className="rounded-lg border border-border/40 bg-muted/40 p-3 text-center">
                                    <span className="block text-xs text-muted-foreground">
                                        {__('exam.questions_count')}
                                    </span>
                                    <span className="text-lg font-bold text-foreground">
                                        {exam.questions?.length || 0} db
                                    </span>
                                </div>
                                <div className="rounded-lg border border-border/40 bg-muted/40 p-3 text-center">
                                    <span className="block text-xs text-muted-foreground">
                                        {__('exam.attempts')}
                                    </span>
                                    <span className="text-lg font-bold text-foreground">
                                        {attempts_count} /{' '}
                                        {exam.max_attempts ??
                                            __('exam.unlimited')}
                                    </span>
                                </div>
                            </div>

                            {latest_attempt &&
                                latest_attempt.status === 'pending' && (
                                    <div className="flex items-center gap-4 rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-4 text-yellow-600">
                                        <AlertTriangle className="h-10 w-10 shrink-0" />
                                        <div>
                                            <h4 className="text-sm font-bold">
                                                {__('exam.recent_pending')}
                                            </h4>
                                            <p className="mt-0.5 text-xs opacity-90">
                                                {__('exam.pending_desc')}
                                            </p>
                                        </div>
                                    </div>
                                )}

                            {latest_attempt &&
                                latest_attempt.status === 'failed' && (
                                    <div className="flex items-center gap-4 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-destructive">
                                        <AlertTriangle className="h-10 w-10 shrink-0" />
                                        <div>
                                            <h4 className="text-sm font-bold">
                                                {__('exam.recent_failed')}
                                            </h4>
                                            <p className="mt-0.5 text-xs opacity-90">
                                                {__('exam.score_achieved')}:{' '}
                                                {latest_attempt.score}%.{' '}
                                                {__('exam.failed_desc', {
                                                    percent: exam.min_percent,
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                )}

                            {latest_attempt &&
                                latest_attempt.status === 'graded' && (
                                    <div
                                        className={`flex items-center gap-4 rounded-xl border p-4 ${
                                            latest_attempt.score !== null &&
                                            latest_attempt.score >=
                                                exam.min_percent
                                                ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600'
                                                : 'border-destructive/20 bg-destructive/10 text-destructive'
                                        }`}
                                    >
                                        {latest_attempt.score !== null &&
                                        latest_attempt.score >=
                                            exam.min_percent ? (
                                            <>
                                                <ShieldCheck className="h-10 w-10 shrink-0" />
                                                <div>
                                                    <h4 className="text-sm font-bold">
                                                        {__(
                                                            'exam.recent_success',
                                                        )}
                                                    </h4>
                                                    <p className="mt-0.5 text-xs opacity-90">
                                                        {__(
                                                            'exam.score_achieved',
                                                        )}
                                                        : {latest_attempt.score}
                                                        %.{' '}
                                                        {__(
                                                            'exam.roles_credited',
                                                        )}
                                                    </p>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <AlertTriangle className="h-10 w-10 shrink-0" />
                                                <div>
                                                    <h4 className="text-sm font-bold">
                                                        {__(
                                                            'exam.recent_failed',
                                                        )}
                                                    </h4>
                                                    <p className="mt-0.5 text-xs opacity-90">
                                                        {__(
                                                            'exam.score_achieved',
                                                        )}
                                                        : {latest_attempt.score}
                                                        %.{' '}
                                                        {__(
                                                            'exam.failed_desc',
                                                            {
                                                                percent:
                                                                    exam.min_percent,
                                                            },
                                                        )}
                                                    </p>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                        </CardContent>
                        <CardFooter className="flex items-center justify-between gap-4 border-t border-border/20 pt-6">
                            <Button asChild variant="outline">
                                <Link href={route('exams.index')}>
                                    {__('exam.back_to_list')}
                                </Link>
                            </Button>

                            <Button
                                onClick={startExam}
                                disabled={!has_attempts_left}
                                className="gap-2 px-6 font-bold shadow-lg shadow-primary/20 transition-all hover:shadow-primary/30"
                            >
                                <Play className="h-4 w-4" />
                                {__('exam.start_exam')}
                            </Button>
                        </CardFooter>
                    </Card>
                </div>

                {/* Side History Panel */}
                <div className="space-y-6">
                    <Card className="border-border/60 bg-gradient-to-br from-card to-background shadow-md">
                        <CardHeader className="flex flex-row items-center gap-2 pb-3">
                            <History className="h-5 w-5 text-primary" />
                            <CardTitle className="text-lg font-bold">
                                {__('exam.past_attempts')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {exam.attempts?.length === 0 ? (
                                <p className="py-6 text-center text-xs text-muted-foreground">
                                    {__('exam.no_past_attempts')}
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {exam.attempts?.map(
                                        (attempt: ExamAttempt, idx: number) => {
                                            const isGradedOrFailed =
                                                attempt.status === 'graded' ||
                                                attempt.status === 'failed';
                                            const passed =
                                                isGradedOrFailed &&
                                                attempt.score !== null &&
                                                attempt.score >=
                                                    exam.min_percent;
                                            return (
                                                <div
                                                    key={attempt.id}
                                                    className="flex items-center justify-between rounded-lg border border-border/60 bg-background/50 p-3 text-xs"
                                                >
                                                    <div className="space-y-0.5">
                                                        <span className="block font-bold text-foreground">
                                                            {__(
                                                                'exam.attempt_num',
                                                                {
                                                                    num:
                                                                        exam
                                                                            .attempts!
                                                                            .length -
                                                                        idx,
                                                                },
                                                            )}
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground">
                                                            {new Date(
                                                                attempt.created_at,
                                                            ).toLocaleDateString(
                                                                'hu-HU',
                                                            )}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        {isGradedOrFailed ? (
                                                            <>
                                                                <Badge
                                                                    variant={
                                                                        passed
                                                                            ? 'default'
                                                                            : 'destructive'
                                                                    }
                                                                    className="font-bold"
                                                                >
                                                                    {
                                                                        attempt.score
                                                                    }
                                                                    %
                                                                </Badge>
                                                                {passed ? (
                                                                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                                                ) : (
                                                                    <XCircle className="h-4 w-4 text-destructive" />
                                                                )}
                                                            </>
                                                        ) : (
                                                            <Badge
                                                                variant="secondary"
                                                                className="font-semibold text-muted-foreground"
                                                            >
                                                                {attempt.status ===
                                                                'started'
                                                                    ? __(
                                                                          'exam.exam_in_progress',
                                                                      )
                                                                    : __(
                                                                          'exam.pending_grading',
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
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    };

    return (
        <AppLayout>
            <Head title={exam.name} />

            <div className="container mx-auto p-6">
                {is_running ? renderRunner() : renderDetails()}
            </div>
        </AppLayout>
    );
}
