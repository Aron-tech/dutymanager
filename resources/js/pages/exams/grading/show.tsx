import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import { PageProps, ExamAttempt } from '@/types';
import AppLayout from '@/layouts/app-layout';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';

interface GradingShowProps extends PageProps {
    exam_attempt: ExamAttempt;
}

const GradingShow: React.FC<GradingShowProps> = ({ auth, exam_attempt }) => {
    const breadcrumbs = [
        { title: 'Dashboard', href: route('dashboard') },
        { title: 'Exam Grading', href: route('exams.grading.index') },
        { title: 'Grade Attempt', href: route('exams.grading.show', exam_attempt.id) },
    ];

    const { data, setData, put, processing, errors } = useForm({
        answers: exam_attempt.exam_attempt_answers.map(ans => ({
            exam_attempt_answer_id: ans.id,
            points_awarded: ans.points_awarded || 0,
            is_correct: ans.is_correct || false,
            feedback: ans.feedback || '',
        }))
    });

    const handleAnswerChange = (index: number, field: string, value: any) => {
        const newAnswers = [...data.answers];
        newAnswers[index] = { ...newAnswers[index], [field]: value };
        setData('answers', newAnswers);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('exams.grading.update', exam_attempt.id));
    };

    const renderUserAnswer = (answer: any) => {
        if (answer.answer_text) {
            return <p className="text-lg">{answer.answer_text}</p>;
        }
        if (answer.exam_attempt_answer_selections?.length > 0) {
            return (
                <ul className="list-disc pl-5 space-y-1">
                    {answer.exam_attempt_answer_selections.map((sel: any) => (
                        <li key={sel.id}>{sel.exam_question_answer.text}</li>
                    ))}
                </ul>
            );
        }
        return <p className="text-muted-foreground italic">No answer provided.</p>;
    };

    return (
        <AppLayout user={auth.user} breadcrumbs={breadcrumbs}>
            <Head title={`Grade Exam: ${exam_attempt.exam.name}`} />
            <div className="max-w-4xl mx-auto space-y-6">
                <Heading
                    title={`Grading: ${exam_attempt.exam.name}`}
                    description={`Attempt by ${exam_attempt.guild_user.user.name} on ${format(new Date(exam_attempt.completed_at), 'PPP')}`}
                />

                <form onSubmit={submit} className="space-y-8">
                    {exam_attempt.exam_attempt_answers.map((answer, index) => (
                        <Card key={answer.id}>
                            <CardHeader>
                                <CardTitle className="flex justify-between items-center">
                                    <span>{index + 1}. {answer.exam_question.text}</span>
                                    <span className="text-sm font-normal text-muted-foreground">
                                        ({answer.exam_question.points} points)
                                    </span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="p-4 bg-muted/50 rounded-md">
                                    <Label className="font-semibold">User's Answer:</Label>
                                    <div className="mt-2">{renderUserAnswer(answer)}</div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                                    <div className="md:col-span-3 space-y-2">
                                        <Label>Points Awarded</Label>
                                        <Input
                                            type="number"
                                            min="0"
                                            max={answer.exam_question.points}
                                            value={data.answers[index].points_awarded}
                                            onChange={(e) => handleAnswerChange(index, 'points_awarded', parseInt(e.target.value) || 0)}
                                            className="w-full"
                                        />
                                    </div>
                                    <div className="md:col-span-9 space-y-2">
                                        <Label>Feedback (optional)</Label>
                                        <Textarea
                                            placeholder="Provide feedback on the user's answer..."
                                            value={data.answers[index].feedback}
                                            onChange={(e) => handleAnswerChange(index, 'feedback', e.target.value)}
                                        />
                                    </div>
                                    <div className="md:col-span-12 flex items-center space-x-2">
                                        <Checkbox
                                            id={`is_correct_${index}`}
                                            checked={data.answers[index].is_correct}
                                            onCheckedChange={(checked) => handleAnswerChange(index, 'is_correct', !!checked)}
                                        />
                                        <Label htmlFor={`is_correct_${index}`} className="cursor-pointer">Mark as correct</Label>
                                    </div>
                                </div>
                                {errors[`answers.${index}.points_awarded`] && <p className="text-sm text-destructive">{errors[`answers.${index}.points_awarded`]}</p>}
                            </CardContent>
                        </Card>
                    ))}

                    <Card>
                        <CardHeader>
                            <CardTitle>Final Grade</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {/* Final grade summary can be added here if needed */}
                            <div className="flex justify-end">
                                <Button type="submit" disabled={processing} size="lg">
                                    Submit Grade
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </form>
            </div>
        </AppLayout>
    );
};

export default GradingShow;
