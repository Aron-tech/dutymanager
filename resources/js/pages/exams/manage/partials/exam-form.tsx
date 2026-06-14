import React from 'react';
import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Exam } from '@/types';
import { Trash2, Plus } from 'lucide-react';

interface ExamFormProps {
    exam?: Exam;
}

export default function ExamForm({ exam }: ExamFormProps) {
    const isEdit = !!exam;

    const { data, setData, post, put, processing, errors } = useForm({
        name: exam?.name || '',
        is_active: exam?.is_active ?? true,
        time_limit: exam?.time_limit || 30,
        max_attempts: exam?.max_attempts || '',
        questions: exam?.questions?.length ? exam.questions.map(q => ({
            id: q.id,
            text: q.text,
            type: q.type,
            points: q.points,
            answers: q.exam_question_answers ? q.exam_question_answers.map(a => ({
                id: a.id,
                text: a.text,
                is_correct: a.is_correct
            })) : []
        })) : [
            { text: '', type: 'single-choice', points: 1, answers: [{ text: '', is_correct: false }] }
        ],
    });

    const addQuestion = () => {
        setData('questions', [
            ...data.questions,
            { text: '', type: 'single-choice', points: 1, answers: [{ text: '', is_correct: false }] }
        ]);
    };

    const removeQuestion = (index: number) => {
        const newQuestions = [...data.questions];
        newQuestions.splice(index, 1);
        setData('questions', newQuestions);
    };

    const addAnswer = (qIndex: number) => {
        const newQuestions = [...data.questions];
        newQuestions[qIndex].answers.push({ text: '', is_correct: false });
        setData('questions', newQuestions);
    };

    const removeAnswer = (qIndex: number, aIndex: number) => {
        const newQuestions = [...data.questions];
        newQuestions[qIndex].answers.splice(aIndex, 1);
        setData('questions', newQuestions);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isEdit) {
            put(route('exams.manage.update', exam.id));
        } else {
            post(route('exams.manage.store'));
        }
    };

    return (
        <form onSubmit={submit} className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Exam Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Exam Name</Label>
                            <Input id="name" value={data.name} onChange={e => setData('name', e.target.value)} required />
                            {errors.name && <div className="text-sm text-destructive">{errors.name}</div>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="time_limit">Time Limit (minutes)</Label>
                            <Input id="time_limit" type="number" min="1" value={data.time_limit} onChange={e => setData('time_limit', parseInt(e.target.value) || 0)} required />
                            {errors.time_limit && <div className="text-sm text-destructive">{errors.time_limit}</div>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="max_attempts">Max Attempts (empty for unlimited)</Label>
                            <Input id="max_attempts" type="number" min="1" value={data.max_attempts} onChange={e => setData('max_attempts', e.target.value ? parseInt(e.target.value) : '')} />
                            {errors.max_attempts && <div className="text-sm text-destructive">{errors.max_attempts}</div>}
                        </div>
                        <div className="flex items-center space-x-2 pt-8">
                            <Checkbox id="is_active" checked={data.is_active} onCheckedChange={(checked) => setData('is_active', !!checked)} />
                            <Label htmlFor="is_active" className="cursor-pointer">Is Active?</Label>
                            {errors.is_active && <div className="text-sm text-destructive">{errors.is_active}</div>}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Questions</h3>
                    <Button type="button" onClick={addQuestion} variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" /> Add Question
                    </Button>
                </div>

                {data.questions.map((q, qIndex) => (
                    <Card key={qIndex} className="relative">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 text-destructive hover:bg-destructive/10"
                            onClick={() => removeQuestion(qIndex)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                        <CardContent className="pt-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                <div className="md:col-span-8 space-y-2">
                                    <Label>Question Text</Label>
                                    <Input value={q.text} onChange={e => {
                                        const newQ = [...data.questions];
                                        newQ[qIndex].text = e.target.value;
                                        setData('questions', newQ);
                                    }} required />
                                    {errors[`questions.${qIndex}.text`] && <div className="text-sm text-destructive">{errors[`questions.${qIndex}.text`]}</div>}
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <Label>Points</Label>
                                    <Input type="number" min="1" value={q.points} onChange={e => {
                                        const newQ = [...data.questions];
                                        newQ[qIndex].points = parseInt(e.target.value) || 1;
                                        setData('questions', newQ);
                                    }} required />
                                    {errors[`questions.${qIndex}.points`] && <div className="text-sm text-destructive">{errors[`questions.${qIndex}.points`]}</div>}
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <Label>Type</Label>
                                    <Select value={q.type} onValueChange={(value) => {
                                        const newQ = [...data.questions];
                                        newQ[qIndex].type = value;
                                        setData('questions', newQ);
                                    }}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="single-choice">Single Choice</SelectItem>
                                            <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                                            <SelectItem value="text">Text (Manual)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors[`questions.${qIndex}.type`] && <div className="text-sm text-destructive">{errors[`questions.${qIndex}.type`]}</div>}
                                </div>
                            </div>

                            {q.type !== 'text' && (
                                <div className="space-y-3 pt-4 border-t">
                                    <Label>Answers</Label>
                                    {q.answers.map((a, aIndex) => (
                                        <div key={aIndex} className="flex items-center space-x-3">
                                            <Checkbox
                                                checked={a.is_correct}
                                                onCheckedChange={(checked) => {
                                                    const newQ = [...data.questions];
                                                    if (q.type === 'single-choice') {
                                                        newQ[qIndex].answers.forEach(ans => ans.is_correct = false);
                                                    }
                                                    newQ[qIndex].answers[aIndex].is_correct = !!checked;
                                                    setData('questions', newQ);
                                                }}
                                            />
                                            <Input
                                                value={a.text}
                                                onChange={e => {
                                                    const newQ = [...data.questions];
                                                    newQ[qIndex].answers[aIndex].text = e.target.value;
                                                    setData('questions', newQ);
                                                }}
                                                placeholder="Answer text"
                                                required
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="text-muted-foreground hover:text-destructive shrink-0"
                                                onClick={() => removeAnswer(qIndex, aIndex)}
                                                disabled={q.answers.length <= 1}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                    <Button type="button" variant="outline" size="sm" onClick={() => addAnswer(qIndex)} className="mt-2">
                                        <Plus className="h-4 w-4 mr-2" /> Add Answer
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="flex justify-end">
                <Button type="submit" disabled={processing} size="lg">
                    {isEdit ? 'Update Exam' : 'Create Exam'}
                </Button>
            </div>
        </form>
    );
}
