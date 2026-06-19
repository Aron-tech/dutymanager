import * as React from 'react';
import { useForm, usePage } from '@inertiajs/react';
import { BookOpen, AlertCircle, GripVertical, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MultiRoleSelect } from '@/components/MultiRoleSelect';
import { Checkbox } from '@/components/ui/checkbox';
import InputError from '@/components/input-error';
import { toast } from 'sonner';

interface ExamBuilderProps {
    guild_roles: Record<string, string>;
    initial_data?: {
        name: string;
        description: string;
        required_roles: string[];
        max_attempts: number | '';
        min_percent: number;
        is_visible: boolean;
        auto_grade: boolean;
        time_limit: number | ''; // in minutes
        settings: {
            passed_roles?: string[];
            shuffle_questions?: boolean;
        };
        questions: Array<{
            id?: number;
            type:
                | 'multiple_choice'
                | 'true_false'
                | 'matching'
                | 'free_text'
                | 'cloze';
            points: number;
            time_limit: number | '';
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
            };
        }>;
    };
    submit_url: string;
    method: 'post' | 'put';
}

export default function ExamBuilder({
    guild_roles,
    initial_data,
    submit_url,
    method,
}: ExamBuilderProps) {
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

    const default_data = {
        name: initial_data?.name ?? '',
        description: initial_data?.description ?? '',
        required_roles: initial_data?.required_roles ?? [],
        max_attempts: initial_data?.max_attempts ?? '',
        min_percent: initial_data?.min_percent ?? '',
        is_visible: initial_data?.is_visible ?? false,
        auto_grade: initial_data?.auto_grade ?? true,
        time_limit: initial_data?.time_limit ?? '',
        settings: {
            passed_roles: initial_data?.settings?.passed_roles ?? [],
            shuffle_questions:
                initial_data?.settings?.shuffle_questions ?? false,
        },
        questions: initial_data?.questions ?? [],
    };

    const {
        data,
        setData,
        post,
        put,
        processing,
        errors,
        setError,
        clearErrors,
    } = useForm(default_data);

    React.useEffect(() => {
        if (Object.keys(errors).length > 0) {
            toast.error(__('exam.validation_error'));
        }
    }, [errors]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        clearErrors('time_limit');

        if (data.time_limit !== '') {
            const timeLimit = Number(data.time_limit);
            let totalQuestionTime = 0;
            data.questions.forEach((q) => {
                if (q.time_limit !== '') {
                    totalQuestionTime += Number(q.time_limit);
                }
            });

            if (totalQuestionTime > timeLimit) {
                setError(
                    'time_limit',
                    __('exam.time_limit_exceeded', {
                        total: totalQuestionTime,
                        limit: timeLimit,
                    }),
                );
                return;
            }
        }

        const payload_data = {
            ...data,
            time_limit: data.time_limit !== '' ? Number(data.time_limit) : null,
            max_attempts:
                data.max_attempts !== '' ? Number(data.max_attempts) : null,
            questions: data.questions.map((q, idx) => ({
                ...q,
                order: idx,
                time_limit: q.time_limit !== '' ? Number(q.time_limit) : null,
            })),
        };

        if (method === 'put') {
            router_put(payload_data);
        } else {
            router_post(payload_data);
        }
    };

    const router_post = (payload: any) => {
        post(submit_url, { data: payload } as any);
    };

    const router_put = (payload: any) => {
        put(submit_url, { data: payload } as any);
    };

    const addQuestion = (
        type:
            | 'multiple_choice'
            | 'true_false'
            | 'matching'
            | 'free_text'
            | 'cloze',
    ) => {
        const new_question = {
            type,
            points: 10,
            time_limit: '' as const,
            order: data.questions.length,
            content:
                type === 'multiple_choice'
                    ? {
                          question_text: '',
                          options: ['', ''],
                          correct_answer: '',
                      }
                    : type === 'true_false'
                      ? { question_text: '', correct: 'true' }
                      : type === 'matching'
                        ? {
                              question_text: '',
                              left_items: ['', ''],
                              right_items: ['', ''],
                              correct_pairs: {},
                          }
                        : type === 'free_text'
                          ? { question_text: '', correct_answer: '' }
                          : { question_text: '', correct_answers: [] },
        };

        setData('questions', [...data.questions, new_question]);
    };

    const handleClozeTextChange = (idx: number, text: string) => {
        const matches = [...text.matchAll(/\[([^\]]+)\]/g)].map((m) => m[1]);
        const updated_questions = [...data.questions];
        updated_questions[idx] = {
            ...updated_questions[idx],
            content: {
                ...updated_questions[idx].content,
                question_text: text,
                correct_answers: matches,
            },
        };
        setData('questions', updated_questions);
    };

    const removeQuestion = (idx: number) => {
        const filtered_questions = data.questions.filter((_, i) => i !== idx);
        setData('questions', filtered_questions);
    };

    const toggleCorrectOption = (q_idx: number, opt_idx: string) => {
        const current_correct =
            data.questions[q_idx].content.correct_options ?? [];
        const new_correct = current_correct.includes(opt_idx)
            ? current_correct.filter((id) => id !== opt_idx)
            : [...current_correct, opt_idx];
        updateQuestionContent(q_idx, 'correct_options', new_correct);
    };

    const handleDragStart = (e: React.DragEvent, index: number) => {
        e.dataTransfer.setData('text/plain', String(index));
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent, targetIndex: number) => {
        e.preventDefault();
        const sourceIndex = Number(e.dataTransfer.getData('text/plain'));
        if (isNaN(sourceIndex) || sourceIndex === targetIndex) return;

        const updated_questions = [...data.questions];
        const [movedQuestion] = updated_questions.splice(sourceIndex, 1);
        updated_questions.splice(targetIndex, 0, movedQuestion);

        // Update orders
        const final_questions = updated_questions.map((q, idx) => ({
            ...q,
            order: idx,
        }));

        setData('questions', final_questions);
    };

    const moveQuestion = (idx: number, direction: 'up' | 'down') => {
        if (direction === 'up' && idx === 0) return;
        if (direction === 'down' && idx === data.questions.length - 1) return;

        const target_idx = direction === 'up' ? idx - 1 : idx + 1;
        const updated_questions = [...data.questions];
        const temp = updated_questions[idx];
        updated_questions[idx] = updated_questions[target_idx];
        updated_questions[target_idx] = temp;

        setData('questions', updated_questions);
    };

    const updateQuestionField = (idx: number, key: string, val: any) => {
        const updated_questions = [...data.questions];
        updated_questions[idx] = {
            ...updated_questions[idx],
            [key]: val,
        };
        setData('questions', updated_questions);
    };

    const updateQuestionContent = (idx: number, key: string, val: any) => {
        const updated_questions = [...data.questions];
        updated_questions[idx] = {
            ...updated_questions[idx],
            content: {
                ...updated_questions[idx].content,
                [key]: val,
            },
        };
        setData('questions', updated_questions);
    };

    const rolesList = React.useMemo(() => {
        if (!guild_roles || typeof guild_roles !== 'object') return [];
        return Object.entries(guild_roles).map(([id, name], idx) => ({
            id,
            name,
            position: idx,
        }));
    }, [guild_roles]);

    return (
        <form onSubmit={handleSubmit} className="w-full space-y-8">
            {/* General Info Card */}
            <Card className="border-border/60 bg-gradient-to-br from-card to-background shadow-lg">
                <CardHeader>
                    <CardTitle className="text-xl font-bold">
                        {__('exam.general_info')}
                    </CardTitle>
                    <CardDescription>
                        {__('exam.general_info_desc')}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="name">{__('exam.exam_name')}</Label>
                            <Input
                                id="name"
                                value={data.name}
                                onChange={(e) =>
                                    setData('name', e.target.value)
                                }
                                className={
                                    errors.name ? 'border-destructive' : ''
                                }
                                placeholder={__('exam.exam_name_placeholder')}
                                required
                            />
                            {errors.name && (
                                <p className="text-xs text-destructive">
                                    {errors.name}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="time_limit">
                                {__('exam.time_limit_input_label')}
                            </Label>
                            <Input
                                id="time_limit"
                                type="number"
                                value={data.time_limit}
                                onChange={(e) =>
                                    setData(
                                        'time_limit',
                                        e.target.value === ''
                                            ? ''
                                            : Number(e.target.value),
                                    )
                                }
                                placeholder={__('exam.no_time_limit')}
                            />
                            <InputError
                                message={errors.time_limit}
                                className="mt-2"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">
                            {__('exam.description')}
                        </Label>
                        <Textarea
                            id="description"
                            value={data.description}
                            onChange={(e) =>
                                setData('description', e.target.value)
                            }
                            placeholder={__('exam.description_placeholder')}
                            rows={3}
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        <div className="space-y-2">
                            <Label htmlFor="min_percent">
                                {__('exam.min_percent_label')}
                            </Label>
                            <Input
                                id="min_percent"
                                type="number"
                                min="0"
                                max="100"
                                placeholder={__('exam.min_percent_placeholder')}
                                value={data.min_percent}
                                onChange={(e) =>
                                    setData(
                                        'min_percent',
                                        e.target.value === ''
                                            ? ''
                                            : Number(e.target.value),
                                    )
                                }
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="max_attempts">
                                {__('exam.max_attempts_label')}
                            </Label>
                            <Input
                                id="max_attempts"
                                type="number"
                                placeholder={__('exam.unlimited')}
                                value={data.max_attempts}
                                onChange={(e) =>
                                    setData(
                                        'max_attempts',
                                        e.target.value === ''
                                            ? ''
                                            : Number(e.target.value),
                                    )
                                }
                            />
                        </div>

                        <div className="mt-6 flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <Label
                                    htmlFor="is_visible"
                                    className="cursor-pointer"
                                >
                                    {__('exam.visible')}
                                </Label>
                                <Switch
                                    id="is_visible"
                                    checked={data.is_visible}
                                    onCheckedChange={(checked) =>
                                        setData('is_visible', checked)
                                    }
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <Label
                                    htmlFor="auto_grade"
                                    className="cursor-pointer"
                                >
                                    {__('exam.auto_grade_label')}
                                </Label>
                                <Switch
                                    id="auto_grade"
                                    checked={data.auto_grade}
                                    onCheckedChange={(checked) =>
                                        setData('auto_grade', checked)
                                    }
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <Label
                                    htmlFor="shuffle_questions"
                                    className="cursor-pointer"
                                >
                                    {__('exam.shuffle_questions')}
                                </Label>
                                <Switch
                                    id="shuffle_questions"
                                    checked={data.settings.shuffle_questions}
                                    onCheckedChange={(checked) =>
                                        setData('settings', {
                                            ...data.settings,
                                            shuffle_questions: checked,
                                        })
                                    }
                                />
                            </div>
                        </div>
                    </div>

                    {/* Roles Configuration */}
                    <div className="grid grid-cols-1 gap-8 border-t border-border/40 pt-6 md:grid-cols-2">
                        {/* Required Roles */}
                        <div className="space-y-3">
                            <Label className="text-sm font-semibold">
                                {__('exam.required_roles_label')}
                            </Label>
                            <MultiRoleSelect
                                roles={rolesList}
                                value={data.required_roles}
                                onChange={(val) =>
                                    setData('required_roles', val)
                                }
                                placeholder={__(
                                    'exam.required_roles_placeholder',
                                )}
                            />
                        </div>

                        {/* Passed Roles (Settings) */}
                        <div className="space-y-3">
                            <Label className="text-sm font-semibold">
                                {__('exam.roles_to_assign')}
                            </Label>
                            <MultiRoleSelect
                                roles={rolesList}
                                value={data.settings.passed_roles ?? []}
                                onChange={(val) =>
                                    setData('settings', {
                                        ...data.settings,
                                        passed_roles: val,
                                    })
                                }
                                placeholder={__(
                                    'exam.passed_roles_placeholder',
                                )}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Questions Section */}
            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-4">
                {/* Main Edit Area */}
                <div className="space-y-6 lg:col-span-3">
                    {/* Questions Header */}
                    <div className="flex items-center justify-between border-b border-border/40 pb-4">
                        <div>
                            <h2 className="text-lg font-bold">
                                {__('exam.manage_questions')}
                            </h2>
                            <p className="text-xs text-muted-foreground">
                                {__('exam.manage_questions_desc')}
                            </p>
                        </div>

                        <div className="flex flex-wrap justify-end gap-2">
                            <Button
                                type="button"
                                onClick={() => addQuestion('multiple_choice')}
                                variant="outline"
                                size="sm"
                            >
                                {__('exam.add_multiple_choice')}
                            </Button>
                            <Button
                                type="button"
                                onClick={() => addQuestion('true_false')}
                                variant="outline"
                                size="sm"
                            >
                                {__('exam.add_true_false')}
                            </Button>
                            <Button
                                type="button"
                                onClick={() => addQuestion('matching')}
                                variant="outline"
                                size="sm"
                            >
                                {__('exam.add_matching')}
                            </Button>
                            <Button
                                type="button"
                                onClick={() => addQuestion('free_text')}
                                variant="outline"
                                size="sm"
                            >
                                {__('exam.add_free_text')}
                            </Button>
                            <Button
                                type="button"
                                onClick={() => addQuestion('cloze')}
                                variant="outline"
                                size="sm"
                            >
                                {__('exam.add_cloze')}
                            </Button>
                        </div>
                    </div>

                    {/* Questions List */}
                    {data.questions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center space-y-3 rounded-xl border-2 border-dashed border-muted bg-card/40 py-12 text-center">
                            <BookOpen className="h-10 w-10 text-muted-foreground/60" />
                            <p className="text-sm font-medium text-foreground">
                                {__('exam.no_questions_in_exam')}
                            </p>
                            <p className="max-w-xs text-xs text-muted-foreground">
                                {__('exam.no_questions_in_exam_desc')}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {data.questions.map((question, idx) => (
                                <Card
                                    key={idx}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, idx)}
                                    className="group relative border-border/60 transition-colors hover:border-primary/40"
                                >
                                    <CardHeader className="flex flex-row items-start justify-between pb-2">
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
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1.5 opacity-60 transition-opacity group-hover:opacity-100">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                                onClick={() =>
                                                    removeQuestion(idx)
                                                }
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                            <div className="space-y-1.5 md:col-span-2">
                                                <Label className="text-xs font-semibold">
                                                    {__('exam.question_text')}
                                                </Label>
                                                <Input
                                                    value={
                                                        question.content
                                                            .question_text ?? ''
                                                    }
                                                    onChange={(e) =>
                                                        updateQuestionContent(
                                                            idx,
                                                            'question_text',
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder={__(
                                                        'exam.question_text_placeholder',
                                                    )}
                                                    required
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs font-semibold">
                                                        {__(
                                                            'exam.points_label',
                                                        )}
                                                    </Label>
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        value={question.points}
                                                        onChange={(e) =>
                                                            updateQuestionField(
                                                                idx,
                                                                'points',
                                                                Number(
                                                                    e.target
                                                                        .value,
                                                                ),
                                                            )
                                                        }
                                                        required
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs font-semibold">
                                                        {__(
                                                            'exam.time_limit_question',
                                                        )}
                                                    </Label>
                                                    <Input
                                                        type="number"
                                                        step="any"
                                                        min="0"
                                                        placeholder={__(
                                                            'exam.no_limit',
                                                        )}
                                                        value={
                                                            question.time_limit
                                                        }
                                                        onChange={(e) =>
                                                            updateQuestionField(
                                                                idx,
                                                                'time_limit',
                                                                e.target
                                                                    .value ===
                                                                    ''
                                                                    ? ''
                                                                    : Number(
                                                                          e
                                                                              .target
                                                                              .value,
                                                                      ),
                                                            )
                                                        }
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Multiple Choice Form */}
                                        {question.type ===
                                            'multiple_choice' && (
                                            <div className="space-y-4 border-t border-border/40 pt-4">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <Label className="text-xs font-bold text-foreground">
                                                            {__(
                                                                'exam.answer_options',
                                                            )}
                                                        </Label>
                                                        <p className="text-[10px] text-muted-foreground">
                                                            {__(
                                                                'exam.multiple_choice_builder_help',
                                                            )}
                                                        </p>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            const current_options =
                                                                question.content
                                                                    .options ??
                                                                [];
                                                            updateQuestionContent(
                                                                idx,
                                                                'options',
                                                                [
                                                                    ...current_options,
                                                                    '',
                                                                ],
                                                            );
                                                        }}
                                                    >
                                                        {__(
                                                            'exam.add_option_btn',
                                                        )}
                                                    </Button>
                                                </div>

                                                <div className="space-y-2">
                                                    {(
                                                        question.content
                                                            .options ?? []
                                                    ).map(
                                                        (
                                                            option: string,
                                                            opt_idx: number,
                                                        ) => (
                                                            <div
                                                                key={opt_idx}
                                                                className="flex items-center gap-3"
                                                            >
                                                                <Checkbox
                                                                    id={`q-${idx}-opt-${opt_idx}`}
                                                                    checked={(
                                                                        question
                                                                            .content
                                                                            .correct_options ??
                                                                        []
                                                                    ).includes(
                                                                        String(
                                                                            opt_idx,
                                                                        ),
                                                                    )}
                                                                    onCheckedChange={() =>
                                                                        toggleCorrectOption(
                                                                            idx,
                                                                            String(
                                                                                opt_idx,
                                                                            ),
                                                                        )
                                                                    }
                                                                />
                                                                <Badge
                                                                    variant="outline"
                                                                    className="font-mono text-xs"
                                                                >
                                                                    {String.fromCharCode(
                                                                        65 +
                                                                            opt_idx,
                                                                    )}
                                                                </Badge>
                                                                <Input
                                                                    value={
                                                                        option
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) => {
                                                                        const new_opts =
                                                                            [
                                                                                ...(question
                                                                                    .content
                                                                                    .options ??
                                                                                    []),
                                                                            ];
                                                                        new_opts[
                                                                            opt_idx
                                                                        ] =
                                                                            e.target.value;
                                                                        updateQuestionContent(
                                                                            idx,
                                                                            'options',
                                                                            new_opts,
                                                                        );
                                                                    }}
                                                                    placeholder={__(
                                                                        'exam.option_placeholder',
                                                                        {
                                                                            num:
                                                                                opt_idx +
                                                                                1,
                                                                        },
                                                                    )}
                                                                    className="flex-grow"
                                                                    required
                                                                />
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-destructive"
                                                                    onClick={() => {
                                                                        const new_opts =
                                                                            (
                                                                                question
                                                                                    .content
                                                                                    .options ??
                                                                                []
                                                                            ).filter(
                                                                                (
                                                                                    _: any,
                                                                                    i: number,
                                                                                ) =>
                                                                                    i !==
                                                                                    opt_idx,
                                                                            );
                                                                        const current_correct =
                                                                            question
                                                                                .content
                                                                                .correct_options ??
                                                                            [];
                                                                        const new_correct =
                                                                            current_correct
                                                                                .map(
                                                                                    Number,
                                                                                )
                                                                                .filter(
                                                                                    (
                                                                                        id,
                                                                                    ) =>
                                                                                        id !==
                                                                                        opt_idx,
                                                                                )
                                                                                .map(
                                                                                    (
                                                                                        id,
                                                                                    ) =>
                                                                                        id >
                                                                                        opt_idx
                                                                                            ? String(
                                                                                                  id -
                                                                                                      1,
                                                                                              )
                                                                                            : String(
                                                                                                  id,
                                                                                              ),
                                                                                );
                                                                        updateQuestionContent(
                                                                            idx,
                                                                            'options',
                                                                            new_opts,
                                                                        );
                                                                        updateQuestionContent(
                                                                            idx,
                                                                            'correct_options',
                                                                            new_correct,
                                                                        );
                                                                    }}
                                                                    disabled={
                                                                        (
                                                                            question
                                                                                .content
                                                                                .options ??
                                                                            []
                                                                        )
                                                                            .length <=
                                                                        2
                                                                    }
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        ),
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* True/False Form */}
                                        {question.type === 'true_false' && (
                                            <div className="max-w-xs space-y-2 border-t border-border/40 pt-4">
                                                <Label className="text-xs font-semibold">
                                                    {__(
                                                        'exam.correct_answer_label',
                                                    )}
                                                </Label>
                                                <Select
                                                    value={String(
                                                        question.content
                                                            .correct ?? 'true',
                                                    )}
                                                    onValueChange={(val) =>
                                                        updateQuestionContent(
                                                            idx,
                                                            'correct',
                                                            val === 'true',
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="true">
                                                            {__(
                                                                'exam.true_option',
                                                            )}
                                                        </SelectItem>
                                                        <SelectItem value="false">
                                                            {__(
                                                                'exam.false_option',
                                                            )}
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}

                                        {/* Matching Form */}
                                        {question.type === 'matching' && (
                                            <div className="space-y-4 border-t border-border/40 pt-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    {/* Left Column (Keys) */}
                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <Label className="text-xs font-semibold text-foreground">
                                                                {__(
                                                                    'exam.left_column',
                                                                )}
                                                            </Label>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => {
                                                                    const current =
                                                                        question
                                                                            .content
                                                                            .left_items ?? [
                                                                            '',
                                                                            '',
                                                                        ];
                                                                    updateQuestionContent(
                                                                        idx,
                                                                        'left_items',
                                                                        [
                                                                            ...current,
                                                                            '',
                                                                        ],
                                                                    );
                                                                }}
                                                                className="h-7 text-xs"
                                                            >
                                                                {__(
                                                                    'exam.add_left_item',
                                                                )}
                                                            </Button>
                                                        </div>
                                                        {(
                                                            question.content
                                                                .left_items ??
                                                            []
                                                        ).map(
                                                            (
                                                                item: string,
                                                                item_idx: number,
                                                            ) => (
                                                                <div
                                                                    key={
                                                                        item_idx
                                                                    }
                                                                    className="flex items-center gap-1.5"
                                                                >
                                                                    <Input
                                                                        value={
                                                                            item
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) => {
                                                                            const new_list =
                                                                                [
                                                                                    ...(question
                                                                                        .content
                                                                                        .left_items ??
                                                                                        []),
                                                                                ];
                                                                            new_list[
                                                                                item_idx
                                                                            ] =
                                                                                e.target.value;
                                                                            updateQuestionContent(
                                                                                idx,
                                                                                'left_items',
                                                                                new_list,
                                                                            );
                                                                        }}
                                                                        placeholder={__(
                                                                            'exam.left_item_placeholder',
                                                                            {
                                                                                num:
                                                                                    item_idx +
                                                                                    1,
                                                                            },
                                                                        )}
                                                                        required
                                                                    />
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-7 w-7 text-destructive"
                                                                        onClick={() => {
                                                                            const new_list =
                                                                                (
                                                                                    question
                                                                                        .content
                                                                                        .left_items ??
                                                                                    []
                                                                                ).filter(
                                                                                    (
                                                                                        _: any,
                                                                                        i: number,
                                                                                    ) =>
                                                                                        i !==
                                                                                        item_idx,
                                                                                );
                                                                            updateQuestionContent(
                                                                                idx,
                                                                                'left_items',
                                                                                new_list,
                                                                            );
                                                                        }}
                                                                        disabled={
                                                                            (
                                                                                question
                                                                                    .content
                                                                                    .left_items ??
                                                                                []
                                                                            )
                                                                                .length <=
                                                                            2
                                                                        }
                                                                    >
                                                                        <Trash2 className="h-3 w-3" />
                                                                    </Button>
                                                                </div>
                                                            ),
                                                        )}
                                                    </div>

                                                    {/* Right Column (Values) */}
                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <Label className="text-xs font-semibold text-foreground">
                                                                {__(
                                                                    'exam.right_column',
                                                                )}
                                                            </Label>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => {
                                                                    const current =
                                                                        question
                                                                            .content
                                                                            .right_items ?? [
                                                                            '',
                                                                            '',
                                                                        ];
                                                                    updateQuestionContent(
                                                                        idx,
                                                                        'right_items',
                                                                        [
                                                                            ...current,
                                                                            '',
                                                                        ],
                                                                    );
                                                                }}
                                                                className="h-7 text-xs"
                                                            >
                                                                {__(
                                                                    'exam.add_right_item',
                                                                )}
                                                            </Button>
                                                        </div>
                                                        {(
                                                            question.content
                                                                .right_items ??
                                                            []
                                                        ).map(
                                                            (
                                                                item: string,
                                                                item_idx: number,
                                                            ) => (
                                                                <div
                                                                    key={
                                                                        item_idx
                                                                    }
                                                                    className="flex items-center gap-1.5"
                                                                >
                                                                    <Input
                                                                        value={
                                                                            item
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) => {
                                                                            const new_list =
                                                                                [
                                                                                    ...(question
                                                                                        .content
                                                                                        .right_items ??
                                                                                        []),
                                                                                ];
                                                                            new_list[
                                                                                item_idx
                                                                            ] =
                                                                                e.target.value;
                                                                            updateQuestionContent(
                                                                                idx,
                                                                                'right_items',
                                                                                new_list,
                                                                            );
                                                                        }}
                                                                        placeholder={__(
                                                                            'exam.right_item_placeholder',
                                                                            {
                                                                                num:
                                                                                    item_idx +
                                                                                    1,
                                                                            },
                                                                        )}
                                                                        required
                                                                    />
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-7 w-7 text-destructive"
                                                                        onClick={() => {
                                                                            const new_list =
                                                                                (
                                                                                    question
                                                                                        .content
                                                                                        .right_items ??
                                                                                    []
                                                                                ).filter(
                                                                                    (
                                                                                        _: any,
                                                                                        i: number,
                                                                                    ) =>
                                                                                        i !==
                                                                                        item_idx,
                                                                                );
                                                                            updateQuestionContent(
                                                                                idx,
                                                                                'right_items',
                                                                                new_list,
                                                                            );
                                                                        }}
                                                                        disabled={
                                                                            (
                                                                                question
                                                                                    .content
                                                                                    .right_items ??
                                                                                []
                                                                            )
                                                                                .length <=
                                                                            2
                                                                        }
                                                                    >
                                                                        <Trash2 className="h-3 w-3" />
                                                                    </Button>
                                                                </div>
                                                            ),
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Matching Pairs Setup */}
                                                <div className="space-y-3 rounded-lg border border-border/40 bg-muted/20 p-3">
                                                    <Label className="text-xs font-bold text-foreground">
                                                        {__(
                                                            'exam.connect_pairs',
                                                        )}
                                                    </Label>
                                                    <div className="space-y-2.5">
                                                        {(
                                                            question.content
                                                                .left_items ??
                                                            []
                                                        ).map(
                                                            (
                                                                left: string,
                                                                left_idx: number,
                                                            ) => (
                                                                <div
                                                                    key={
                                                                        left_idx
                                                                    }
                                                                    className="flex items-center gap-3"
                                                                >
                                                                    <span className="min-w-[120px] truncate text-xs font-semibold">
                                                                        {left ||
                                                                            __(
                                                                                'exam.left_item_placeholder',
                                                                                {
                                                                                    num:
                                                                                        left_idx +
                                                                                        1,
                                                                                },
                                                                            )}
                                                                    </span>
                                                                    <span className="text-xs text-muted-foreground">
                                                                        &rarr;
                                                                    </span>
                                                                    <Select
                                                                        value={
                                                                            question
                                                                                .content
                                                                                .correct_pairs?.[
                                                                                left
                                                                            ] ??
                                                                            ''
                                                                        }
                                                                        onValueChange={(
                                                                            val,
                                                                        ) => {
                                                                            const new_pairs =
                                                                                {
                                                                                    ...(question
                                                                                        .content
                                                                                        .correct_pairs ??
                                                                                        {}),
                                                                                };
                                                                            new_pairs[
                                                                                left
                                                                            ] =
                                                                                val;
                                                                            updateQuestionContent(
                                                                                idx,
                                                                                'correct_pairs',
                                                                                new_pairs,
                                                                            );
                                                                        }}
                                                                    >
                                                                        <SelectTrigger className="flex-grow">
                                                                            <SelectValue
                                                                                placeholder={__(
                                                                                    'exam.matching_placeholder',
                                                                                )}
                                                                            />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            {(
                                                                                question
                                                                                    .content
                                                                                    .right_items ??
                                                                                []
                                                                            )
                                                                                .filter(
                                                                                    (
                                                                                        right: string,
                                                                                    ) =>
                                                                                        right !==
                                                                                        '',
                                                                                )
                                                                                .map(
                                                                                    (
                                                                                        right: string,
                                                                                        right_idx: number,
                                                                                    ) => (
                                                                                        <SelectItem
                                                                                            key={
                                                                                                right_idx
                                                                                            }
                                                                                            value={
                                                                                                right
                                                                                            }
                                                                                        >
                                                                                            {
                                                                                                right
                                                                                            }
                                                                                        </SelectItem>
                                                                                    ),
                                                                                )}
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                            ),
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Free Text Form */}
                                        {question.type === 'free_text' && (
                                            <div className="max-w-lg space-y-2 border-t border-border/40 pt-4">
                                                <Label className="text-xs font-semibold">
                                                    {__(
                                                        'exam.correct_answer_text',
                                                    )}
                                                </Label>
                                                <Input
                                                    value={
                                                        question.content
                                                            .correct_answer ??
                                                        ''
                                                    }
                                                    onChange={(e) =>
                                                        updateQuestionContent(
                                                            idx,
                                                            'correct_answer',
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder={__(
                                                        'exam.correct_answer_placeholder',
                                                    )}
                                                    required
                                                />
                                                <p className="text-[11px] text-muted-foreground">
                                                    {__('exam.free_text_help')}
                                                </p>
                                            </div>
                                        )}

                                        {/* Cloze Form */}
                                        {question.type === 'cloze' && (
                                            <div className="space-y-4 border-t border-border/40 pt-4">
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-bold text-foreground">
                                                        {__(
                                                            'exam.cloze_text_label',
                                                        )}
                                                    </Label>
                                                    <Textarea
                                                        value={
                                                            question.content
                                                                .question_text ??
                                                            ''
                                                        }
                                                        onChange={(e) =>
                                                            handleClozeTextChange(
                                                                idx,
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder={__(
                                                            'exam.cloze_placeholder',
                                                        )}
                                                        rows={3}
                                                        required
                                                    />
                                                    <p className="text-[11px] text-muted-foreground">
                                                        {__('exam.cloze_help')}
                                                    </p>
                                                </div>

                                                {question.content
                                                    .correct_answers &&
                                                    question.content
                                                        .correct_answers
                                                        .length > 0 && (
                                                        <div className="space-y-2.5 rounded-lg border border-border/40 bg-muted/20 p-3">
                                                            <Label className="text-xs font-bold text-foreground">
                                                                {__(
                                                                    'exam.detected_words',
                                                                )}
                                                            </Label>
                                                            <div className="space-y-1.5">
                                                                {question.content.correct_answers.map(
                                                                    (
                                                                        answer: string,
                                                                        ans_idx: number,
                                                                    ) => {
                                                                        const wordCount =
                                                                            answer
                                                                                .trim()
                                                                                .split(
                                                                                    /\s+/,
                                                                                )
                                                                                .filter(
                                                                                    Boolean,
                                                                                ).length;
                                                                        return (
                                                                            <div
                                                                                key={
                                                                                    ans_idx
                                                                                }
                                                                                className="flex items-center gap-2 text-xs"
                                                                            >
                                                                                <Badge
                                                                                    variant="outline"
                                                                                    className="font-mono"
                                                                                >
                                                                                    #
                                                                                    {ans_idx +
                                                                                        1}
                                                                                </Badge>
                                                                                <span className="font-semibold text-foreground">
                                                                                    {
                                                                                        answer
                                                                                    }
                                                                                </span>
                                                                                <span className="text-muted-foreground">
                                                                                    (
                                                                                    {wordCount >
                                                                                    1
                                                                                        ? __(
                                                                                              'exam.words',
                                                                                          )
                                                                                        : __(
                                                                                              'exam.word',
                                                                                          )}

                                                                                    )
                                                                                </span>
                                                                            </div>
                                                                        );
                                                                    },
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                {/* Sidebar reorder */}
                {data.questions.length > 0 && (
                    <div className="sticky top-6 space-y-4 lg:col-span-1">
                        <Card className="border-border/60 bg-card/50 shadow-md">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-sm font-bold">
                                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                                    {__('exam.reorder_title')}
                                </CardTitle>
                                <CardDescription className="text-[11px]">
                                    {__('exam.reorder_desc')}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="max-h-[600px] space-y-2 overflow-y-auto pr-4 pl-4">
                                {data.questions.map((question, idx) => (
                                    <div
                                        key={idx}
                                        draggable
                                        onDragStart={(e) =>
                                            handleDragStart(e, idx)
                                        }
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => handleDrop(e, idx)}
                                        className="group flex cursor-grab items-center gap-2 rounded-lg border border-border bg-background p-2 transition-colors hover:bg-muted/40 active:cursor-grabbing"
                                    >
                                        <GripVertical className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60 group-hover:text-muted-foreground" />
                                        <div className="min-w-0 flex-1">
                                            <div className="mb-0.5 flex items-center gap-1.5">
                                                <span className="font-mono text-[10px] font-bold text-muted-foreground">
                                                    #{idx + 1}
                                                </span>
                                                <Badge
                                                    variant="outline"
                                                    className="max-w-[80px] truncate px-1 py-0 text-[9px] capitalize"
                                                >
                                                    {question.type ===
                                                    'multiple_choice'
                                                        ? __('exam.badge_mc')
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
                                                                    'exam.badge_text',
                                                                )
                                                              : __(
                                                                    'exam.badge_cloze',
                                                                )}
                                                </Badge>
                                            </div>
                                            <p className="truncate text-xs font-medium text-foreground">
                                                {question.content
                                                    .question_text ||
                                                    __('exam.empty_question')}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>

            {/* Error Message */}
            {Object.keys(errors).length > 0 && (
                <div className="flex items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <div>
                        <p className="font-semibold">{__('exam.save_error')}</p>
                        <p className="text-xs">{__('exam.save_error_desc')}</p>
                    </div>
                </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-end gap-4 border-t border-border/40 pt-6">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => window.history.back()}
                    disabled={processing}
                >
                    {__('exam.cancel')}
                </Button>
                <Button
                    type="submit"
                    disabled={processing || data.questions.length === 0}
                    className="shadow-lg shadow-primary/10"
                >
                    {processing ? __('exam.saving') : __('exam.save_exam')}
                </Button>
            </div>
        </form>
    );
}
