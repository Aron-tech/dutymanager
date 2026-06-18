import * as React from 'react';
import { useForm } from '@inertiajs/react';
import { BookOpen, AlertCircle, GripVertical, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MultiRoleSelect } from '@/components/MultiRoleSelect';
import { Checkbox } from '@/components/ui/checkbox';
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
            type: 'multiple_choice' | 'true_false' | 'matching' | 'free_text' | 'cloze';
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

export default function ExamBuilder({ guild_roles, initial_data, submit_url, method }: ExamBuilderProps) {
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
            shuffle_questions: initial_data?.settings?.shuffle_questions ?? false
        },
        questions: initial_data?.questions ?? []
    };

    const { data, setData, post, put, processing, errors } = useForm(default_data);

    React.useEffect(() => {
        if (Object.keys(errors).length > 0) {
            toast.error('Mentési hiba! Kérjük, ellenőrizd az űrlapot.');
        }
    }, [errors]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const payload_data = {
            ...data,
            time_limit: data.time_limit !== '' ? Number(data.time_limit) : null,
            max_attempts: data.max_attempts !== '' ? Number(data.max_attempts) : null,
            questions: data.questions.map((q, idx) => ({
                ...q,
                order: idx,
                time_limit: q.time_limit !== '' ? Number(q.time_limit) : null
            }))
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

    const addQuestion = (type: 'multiple_choice' | 'true_false' | 'matching' | 'free_text' | 'cloze') => {
        const new_question = {
            type,
            points: 10,
            time_limit: '' as const,
            order: data.questions.length,
            content: type === 'multiple_choice'
                ? { question_text: '', options: ['', ''], correct_answer: '' }
                : type === 'true_false'
                ? { question_text: '', correct: 'true' }
                : type === 'matching'
                ? { question_text: '', left_items: ['', ''], right_items: ['', ''], correct_pairs: {} }
                : type === 'free_text'
                ? { question_text: '', correct_answer: '' }
                : { question_text: '', correct_answers: [] }
        };

        setData('questions', [...data.questions, new_question]);
    };

    const handleClozeTextChange = (idx: number, text: string) => {
        const matches = [...text.matchAll(/\[([^\]]+)\]/g)].map(m => m[1]);
        const updated_questions = [...data.questions];
        updated_questions[idx] = {
            ...updated_questions[idx],
            content: {
                ...updated_questions[idx].content,
                question_text: text,
                correct_answers: matches
            }
        };
        setData('questions', updated_questions);
    };

    const removeQuestion = (idx: number) => {
        const filtered_questions = data.questions.filter((_, i) => i !== idx);
        setData('questions', filtered_questions);
    };

    const toggleCorrectOption = (q_idx: number, opt_idx: string) => {
        const current_correct = data.questions[q_idx].content.correct_options ?? [];
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
            order: idx
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
            [key]: val
        };
        setData('questions', updated_questions);
    };

    const updateQuestionContent = (idx: number, key: string, val: any) => {
        const updated_questions = [...data.questions];
        updated_questions[idx] = {
            ...updated_questions[idx],
            content: {
                ...updated_questions[idx].content,
                [key]: val
            }
        };
        setData('questions', updated_questions);
    };

    const rolesList = React.useMemo(() => {
        if (!guild_roles || typeof guild_roles !== 'object') return [];
        return Object.entries(guild_roles).map(([id, name], idx) => ({
            id,
            name,
            position: idx
        }));
    }, [guild_roles]);

    return (
        <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl mx-auto">
            {/* General Info Card */}
            <Card className="border-border/60 bg-gradient-to-br from-card to-background shadow-lg">
                <CardHeader>
                    <CardTitle className="text-xl font-bold">Vizsga adatai</CardTitle>
                    <CardDescription>Add meg a vizsga nevét, leírását és a főbb beállításokat.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">Vizsga neve</Label>
                            <Input
                                id="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                className={errors.name ? 'border-destructive' : ''}
                                placeholder="Pl. Frakció Szabályzati Vizsga"
                                required
                            />
                            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="time_limit">Időkorlát (perc, üres ha nincs)</Label>
                            <Input
                                id="time_limit"
                                type="number"
                                value={data.time_limit}
                                onChange={(e) => setData('time_limit', e.target.value === '' ? '' : Number(e.target.value))}
                                placeholder="Nincs időkorlát"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Leírás</Label>
                        <Textarea
                            id="description"
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            placeholder="Írd le röviden a vizsga témáját vagy követelményeit..."
                            rows={3}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="min_percent">Sikeres vizsga szint (%)</Label>
                            <Input
                                id="min_percent"
                                type="number"
                                min="0"
                                max="100"
                                placeholder="Pl. 60"
                                value={data.min_percent}
                                onChange={(e) => setData('min_percent', e.target.value === '' ? '' : Number(e.target.value))}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="max_attempts">Maximális kitöltések száma</Label>
                            <Input
                                id="max_attempts"
                                type="number"
                                placeholder="Végtelen"
                                value={data.max_attempts}
                                onChange={(e) => setData('max_attempts', e.target.value === '' ? '' : Number(e.target.value))}
                            />
                        </div>

                        <div className="flex flex-col gap-4 mt-6">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="is_visible" className="cursor-pointer">Látható</Label>
                                <Switch
                                    id="is_visible"
                                    checked={data.is_visible}
                                    onCheckedChange={(checked) => setData('is_visible', checked)}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <Label htmlFor="auto_grade" className="cursor-pointer">Automatikus javítás</Label>
                                <Switch
                                    id="auto_grade"
                                    checked={data.auto_grade}
                                    onCheckedChange={(checked) => setData('auto_grade', checked)}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <Label htmlFor="shuffle_questions" className="cursor-pointer">Kérdések összekeverése</Label>
                                <Switch
                                    id="shuffle_questions"
                                    checked={data.settings.shuffle_questions}
                                    onCheckedChange={(checked) => setData('settings', { ...data.settings, shuffle_questions: checked })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Roles Configuration */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-border/40 pt-6">
                        {/* Required Roles */}
                        <div className="space-y-3">
                            <Label className="text-sm font-semibold">Szükséges rangok a kitöltéshez</Label>
                            <MultiRoleSelect
                                roles={rolesList}
                                value={data.required_roles}
                                onChange={(val) => setData('required_roles', val)}
                                placeholder="Válassz szükséges rangokat..."
                            />
                        </div>

                        {/* Passed Roles (Settings) */}
                        <div className="space-y-3">
                            <Label className="text-sm font-semibold">Sikeres vizsga után járó rangok</Label>
                            <MultiRoleSelect
                                roles={rolesList}
                                value={data.settings.passed_roles ?? []}
                                onChange={(val) => setData('settings', { ...data.settings, passed_roles: val })}
                                placeholder="Válassz sikeres vizsga után járó rangokat..."
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Questions Section */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
                {/* Main Edit Area */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Questions Header */}
                    <div className="flex justify-between items-center border-b border-border/40 pb-4">
                        <div>
                            <h2 className="text-lg font-bold">Kérdések kezelése</h2>
                            <p className="text-xs text-muted-foreground">Adj hozzá kérdéseket, határozd meg a pontértékeket és jelöld meg a helyes válaszokat.</p>
                        </div>

                        <div className="flex gap-2 flex-wrap justify-end">
                            <Button type="button" onClick={() => addQuestion('multiple_choice')} variant="outline" size="sm">
                                + Feleletválasztós
                            </Button>
                            <Button type="button" onClick={() => addQuestion('true_false')} variant="outline" size="sm">
                                + Igaz/Hamis
                            </Button>
                            <Button type="button" onClick={() => addQuestion('matching')} variant="outline" size="sm">
                                + Párosítás
                            </Button>
                            <Button type="button" onClick={() => addQuestion('free_text')} variant="outline" size="sm">
                                + Szabad szöveges
                            </Button>
                            <Button type="button" onClick={() => addQuestion('cloze')} variant="outline" size="sm">
                                + Behelyettesítős
                            </Button>
                        </div>
                    </div>

                    {/* Questions List */}
                    {data.questions.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed border-muted rounded-xl bg-card/40 flex flex-col items-center justify-center space-y-3">
                            <BookOpen className="h-10 w-10 text-muted-foreground/60" />
                            <p className="text-sm font-medium text-foreground">Nincsenek kérdések a vizsgában</p>
                            <p className="text-xs text-muted-foreground max-w-xs">A vizsga elmentéséhez legalább egy kérdést hozz létre fentebb.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {data.questions.map((question, idx) => (
                                <Card
                                    key={idx}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, idx)}
                                    className="border-border/60 relative group hover:border-primary/40 transition-colors"
                                >
                                     <CardHeader className="flex flex-row justify-between items-start pb-2">
                                         <div className="space-y-1">
                                             <div className="flex items-center gap-2">
                                                 <Badge className="font-mono text-xs">#{idx + 1}</Badge>
                                                 <Badge variant="outline" className="capitalize text-[10px]">
                                                     {question.type === 'multiple_choice'
                                                         ? 'Feleletválasztós'
                                                         : question.type === 'true_false'
                                                         ? 'Igaz/Hamis'
                                                         : question.type === 'matching'
                                                         ? 'Párosítás'
                                                         : question.type === 'free_text'
                                                         ? 'Szabad szöveges'
                                                         : 'Behelyettesítős'}
                                                 </Badge>
                                             </div>
                                         </div>

                                        <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                                            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => removeQuestion(idx)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="md:col-span-2 space-y-1.5">
                                                <Label className="text-xs font-semibold">Kérdés szövege</Label>
                                                <Input
                                                    value={question.content.question_text ?? ''}
                                                    onChange={(e) => updateQuestionContent(idx, 'question_text', e.target.value)}
                                                    placeholder="Írd be a kérdés szövegét..."
                                                    required
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs font-semibold">Pont</Label>
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        value={question.points}
                                                        onChange={(e) => updateQuestionField(idx, 'points', Number(e.target.value))}
                                                        required
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs font-semibold">Időkorlát (perc)</Label>
                                                    <Input
                                                        type="number"
                                                        step="any"
                                                        min="0"
                                                        placeholder="Nincs"
                                                        value={question.time_limit}
                                                        onChange={(e) => updateQuestionField(idx, 'time_limit', e.target.value === '' ? '' : Number(e.target.value))}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Multiple Choice Form */}
                                        {question.type === 'multiple_choice' && (
                                            <div className="space-y-4 border-t border-border/40 pt-4">
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <Label className="text-xs font-bold text-foreground">Válaszlehetőségek</Label>
                                                        <p className="text-[10px] text-muted-foreground">Jelöld be a helyes opciókat a bal oldali jelölőnégyzetekkel (többet is bejelölhetsz).</p>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            const current_options = question.content.options ?? [];
                                                            updateQuestionContent(idx, 'options', [...current_options, '']);
                                                        }}
                                                    >
                                                        Opció hozzáadása
                                                    </Button>
                                                </div>

                                                <div className="space-y-2">
                                                    {(question.content.options ?? []).map((option: string, opt_idx: number) => (
                                                        <div key={opt_idx} className="flex gap-3 items-center">
                                                            <Checkbox
                                                                id={`q-${idx}-opt-${opt_idx}`}
                                                                checked={(question.content.correct_options ?? []).includes(String(opt_idx))}
                                                                onCheckedChange={() => toggleCorrectOption(idx, String(opt_idx))}
                                                            />
                                                            <Badge variant="outline" className="font-mono text-xs">{String.fromCharCode(65 + opt_idx)}</Badge>
                                                            <Input
                                                                value={option}
                                                                onChange={(e) => {
                                                                    const new_opts = [...(question.content.options ?? [])];
                                                                    new_opts[opt_idx] = e.target.value;
                                                                    updateQuestionContent(idx, 'options', new_opts);
                                                                }}
                                                                placeholder={`Opció ${opt_idx + 1}`}
                                                                className="flex-grow"
                                                                required
                                                            />
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-destructive"
                                                                onClick={() => {
                                                                    const new_opts = (question.content.options ?? []).filter((_: any, i: number) => i !== opt_idx);
                                                                    const current_correct = question.content.correct_options ?? [];
                                                                    const new_correct = current_correct
                                                                        .map(Number)
                                                                        .filter((id) => id !== opt_idx)
                                                                        .map((id) => id > opt_idx ? String(id - 1) : String(id));
                                                                    updateQuestionContent(idx, 'options', new_opts);
                                                                    updateQuestionContent(idx, 'correct_options', new_correct);
                                                                }}
                                                                disabled={(question.content.options ?? []).length <= 2}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* True/False Form */}
                                        {question.type === 'true_false' && (
                                            <div className="space-y-2 max-w-xs border-t border-border/40 pt-4">
                                                <Label className="text-xs font-semibold">Helyes válasz</Label>
                                                <Select
                                                    value={String(question.content.correct ?? 'true')}
                                                    onValueChange={(val) => updateQuestionContent(idx, 'correct', val === 'true')}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="true">Igaz</SelectItem>
                                                        <SelectItem value="false">Hamis</SelectItem>
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
                                                        <div className="flex justify-between items-center">
                                                            <Label className="text-xs font-semibold text-foreground">Bal oszlop (pl. Fogalom)</Label>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => {
                                                                    const current = question.content.left_items ?? ['', ''];
                                                                    updateQuestionContent(idx, 'left_items', [...current, '']);
                                                                }}
                                                                className="h-7 text-xs"
                                                            >
                                                                + Bal elem
                                                            </Button>
                                                        </div>
                                                        {(question.content.left_items ?? []).map((item: string, item_idx: number) => (
                                                            <div key={item_idx} className="flex gap-1.5 items-center">
                                                                <Input
                                                                    value={item}
                                                                    onChange={(e) => {
                                                                        const new_list = [...(question.content.left_items ?? [])];
                                                                        new_list[item_idx] = e.target.value;
                                                                        updateQuestionContent(idx, 'left_items', new_list);
                                                                    }}
                                                                    placeholder={`Bal elem ${item_idx + 1}`}
                                                                    required
                                                                />
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-7 w-7 text-destructive"
                                                                    onClick={() => {
                                                                        const new_list = (question.content.left_items ?? []).filter((_: any, i: number) => i !== item_idx);
                                                                        updateQuestionContent(idx, 'left_items', new_list);
                                                                    }}
                                                                    disabled={(question.content.left_items ?? []).length <= 2}
                                                                >
                                                                    <Trash2 className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* Right Column (Values) */}
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between items-center">
                                                            <Label className="text-xs font-semibold text-foreground">Jobb oszlop (pl. Definíció)</Label>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => {
                                                                    const current = question.content.right_items ?? ['', ''];
                                                                    updateQuestionContent(idx, 'right_items', [...current, '']);
                                                                }}
                                                                className="h-7 text-xs"
                                                            >
                                                                + Jobb elem
                                                            </Button>
                                                        </div>
                                                        {(question.content.right_items ?? []).map((item: string, item_idx: number) => (
                                                            <div key={item_idx} className="flex gap-1.5 items-center">
                                                                <Input
                                                                    value={item}
                                                                    onChange={(e) => {
                                                                        const new_list = [...(question.content.right_items ?? [])];
                                                                        new_list[item_idx] = e.target.value;
                                                                        updateQuestionContent(idx, 'right_items', new_list);
                                                                    }}
                                                                    placeholder={`Jobb elem ${item_idx + 1}`}
                                                                    required
                                                                />
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-7 w-7 text-destructive"
                                                                    onClick={() => {
                                                                        const new_list = (question.content.right_items ?? []).filter((_: any, i: number) => i !== item_idx);
                                                                        updateQuestionContent(idx, 'right_items', new_list);
                                                                    }}
                                                                    disabled={(question.content.right_items ?? []).length <= 2}
                                                                >
                                                                    <Trash2 className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Matching Pairs Setup */}
                                                <div className="space-y-3 bg-muted/20 p-3 rounded-lg border border-border/40">
                                                    <Label className="text-xs font-bold text-foreground">Helyes párosítások összekötése</Label>
                                                    <div className="space-y-2.5">
                                                        {(question.content.left_items ?? []).map((left: string, left_idx: number) => (
                                                            <div key={left_idx} className="flex items-center gap-3">
                                                                <span className="text-xs font-semibold min-w-[120px] truncate">{left || `Bal elem ${left_idx + 1}`}</span>
                                                                <span className="text-muted-foreground text-xs">&rarr;</span>
                                                                <Select
                                                                    value={question.content.correct_pairs?.[left] ?? ''}
                                                                    onValueChange={(val) => {
                                                                        const new_pairs = { ...(question.content.correct_pairs ?? {}) };
                                                                        new_pairs[left] = val;
                                                                        updateQuestionContent(idx, 'correct_pairs', new_pairs);
                                                                    }}
                                                                >
                                                                    <SelectTrigger className="flex-grow">
                                                                        <SelectValue placeholder="Válassz párt" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {(question.content.right_items ?? []).filter((right: string) => right !== '').map((right: string, right_idx: number) => (
                                                                            <SelectItem key={right_idx} value={right}>
                                                                                {right}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Free Text Form */}
                                        {question.type === 'free_text' && (
                                            <div className="space-y-2 max-w-lg border-t border-border/40 pt-4">
                                                <Label className="text-xs font-semibold">Helyes válasz (szöveg)</Label>
                                                <Input
                                                    value={question.content.correct_answer ?? ''}
                                                    onChange={(e) => updateQuestionContent(idx, 'correct_answer', e.target.value)}
                                                    placeholder="Írd be a helyes választ (pl. a várt szót vagy kifejezést)..."
                                                    required
                                                />
                                                <p className="text-[11px] text-muted-foreground">A rendszer kis- és nagybetűket nem megkülönböztetve fogja ellenőrizni a beírt választ.</p>
                                            </div>
                                        )}

                                        {/* Cloze Form */}
                                        {question.type === 'cloze' && (
                                            <div className="space-y-4 border-t border-border/40 pt-4">
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-bold text-foreground">Behelyettesítős szöveg</Label>
                                                    <Textarea
                                                        value={question.content.question_text ?? ''}
                                                        onChange={(e) => handleClozeTextChange(idx, e.target.value)}
                                                        placeholder="Írd be a szöveget, és a hiányzó szavakat tedd szögletes zárójelbe, pl.: A Laravel egy [PHP] alapú keretrendszer."
                                                        rows={3}
                                                        required
                                                    />
                                                    <p className="text-[11px] text-muted-foreground">
                                                        Tedd a behelyettesítendő szavakat szögletes zárójelek közé, pl. <code>[szó]</code> vagy <code>[két szó]</code>. A rendszer ezek helyén beviteli mezőket fog megjeleníteni.
                                                    </p>
                                                </div>

                                                {question.content.correct_answers && question.content.correct_answers.length > 0 && (
                                                    <div className="space-y-2.5 bg-muted/20 p-3 rounded-lg border border-border/40">
                                                        <Label className="text-xs font-bold text-foreground">Észlelt hiányzó szavak (helyes válaszok)</Label>
                                                        <div className="space-y-1.5">
                                                            {question.content.correct_answers.map((answer: string, ans_idx: number) => {
                                                                const wordCount = answer.trim().split(/\s+/).filter(Boolean).length;
                                                                return (
                                                                    <div key={ans_idx} className="flex items-center gap-2 text-xs">
                                                                        <Badge variant="outline" className="font-mono">#{ans_idx + 1}</Badge>
                                                                        <span className="font-semibold text-foreground">{answer}</span>
                                                                        <span className="text-muted-foreground">({wordCount > 1 ? `${wordCount} szó` : '1 szó'})</span>
                                                                    </div>
                                                                );
                                                            })}
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
                    <div className="lg:col-span-1 sticky top-6 space-y-4">
                        <Card className="border-border/60 bg-card/50 shadow-md">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                                    Sorrend módosítása
                                </CardTitle>
                                <CardDescription className="text-[11px]">
                                    Húzd és ejtsd a kártyákat a sorrend megváltoztatásához.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                                {data.questions.map((question, idx) => (
                                    <div
                                        key={idx}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, idx)}
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => handleDrop(e, idx)}
                                        className="flex items-center gap-2 p-2 rounded-lg border border-border bg-background hover:bg-muted/40 transition-colors cursor-grab active:cursor-grabbing group"
                                    >
                                        <GripVertical className="h-3.5 w-3.5 text-muted-foreground/60 group-hover:text-muted-foreground shrink-0" />
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-1.5 mb-0.5">
                                                <span className="text-[10px] font-bold font-mono text-muted-foreground">#{idx + 1}</span>
                                                <Badge variant="outline" className="text-[9px] px-1 py-0 capitalize truncate max-w-[80px]">
                                                    {question.type === 'multiple_choice' ? 'Feleletv.' :
                                                     question.type === 'true_false' ? 'Igaz/Hamis' :
                                                     question.type === 'matching' ? 'Párosítás' :
                                                     question.type === 'free_text' ? 'Szöveges' : 'Behely.'}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-foreground font-medium truncate">
                                                {question.content.question_text || '(Üres kérdés)'}
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
                <div className="p-4 bg-destructive/10 text-destructive rounded-lg border border-destructive/20 flex items-center gap-3 text-sm">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <div>
                        <p className="font-semibold">Mentési hiba történt</p>
                        <p className="text-xs">Ellenőrizd az űrlap adatait és javítsd a pirossal jelölt mezőket.</p>
                    </div>
                </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-end gap-4 border-t border-border/40 pt-6">
                <Button type="button" variant="outline" onClick={() => window.history.back()} disabled={processing}>
                    Mégse
                </Button>
                <Button type="submit" disabled={processing || data.questions.length === 0} className="shadow-lg shadow-primary/10">
                    {processing ? 'Mentés...' : 'Vizsga mentése'}
                </Button>
            </div>
        </form>
    );
}
