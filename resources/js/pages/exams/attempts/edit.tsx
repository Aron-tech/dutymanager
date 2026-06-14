import React, { useState, useEffect } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { PageProps, ExamAttempt } from '@/types';
import AuthenticatedLayout from '@/layouts/authenticated-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';

interface ExamAttemptEditProps extends PageProps {
    exam_attempt: ExamAttempt;
}

const ExamAttemptEdit: React.FC<ExamAttemptEditProps> = ({ auth, exam_attempt }) => {
    const { data, setData, put, processing } = useForm({
        answers: {},
    });

    const [timeLeft, setTimeLeft] = useState(0);

    useEffect(() => {
        const endTime = new Date(exam_attempt.started_at).getTime() + exam_attempt.exam.time_limit * 60 * 1000;
        const interval = setInterval(() => {
            const now = new Date().getTime();
            const distance = endTime - now;
            setTimeLeft(distance);
            if (distance < 0) {
                clearInterval(interval);
                // Auto-submit logic could be added here
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [exam_attempt]);

    const formatTime = (ms: number) => {
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((ms % (1000 * 60)) / 1000);
        return `${minutes}m ${seconds}s`;
    };

    const handleAnswerChange = (questionId: number, answer: string | number | { [key: number]: boolean }) => {
        setData('answers', {
            ...data.answers,
            [questionId]: answer,
        });
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('exams.attempts.update', exam_attempt.id));
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title={`Taking Exam: ${exam_attempt.exam.name}`} />
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>
                            {exam_attempt.exam.name}
                        </CardTitle>
                        <div className="text-lg font-bold text-red-500">
                            Time Left: {formatTime(timeLeft)}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-8">
                            {exam_attempt.exam.questions.map((question, index) => (
                                <div key={question.id} className="p-4 border rounded-lg">
                                    <p className="font-semibold">{index + 1}. {question.text} ({question.points} points)</p>
                                    {question.type === 'single-choice' && (
                                        <RadioGroup onValueChange={(value) => handleAnswerChange(question.id, parseInt(value))}>
                                            {question.exam_question_answers.map((answer) => (
                                                <div key={answer.id} className="flex items-center space-x-2">
                                                    <RadioGroupItem value={answer.id.toString()} id={`q${question.id}-a${answer.id}`} />
                                                    <Label htmlFor={`q${question.id}-a${answer.id}`}>{answer.text}</Label>
                                                </div>
                                            ))}
                                        </RadioGroup>
                                    )}
                                    {question.type === 'multiple-choice' && (
                                        <div>
                                            {question.exam_question_answers.map((answer) => (
                                                <div key={answer.id} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={`q${question.id}-a${answer.id}`}
                                                        onCheckedChange={(checked) => {
                                                            const currentAnswers = data.answers[question.id] || {};
                                                            handleAnswerChange(question.id, { ...currentAnswers, [answer.id]: checked });
                                                        }}
                                                    />
                                                    <Label htmlFor={`q${question.id}-a${answer.id}`}>{answer.text}</Label>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {question.type === 'text' && (
                                        <Textarea
                                            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                                            className="mt-2"
                                        />
                                    )}
                                </div>
                            ))}
                            <Button type="submit" disabled={processing}>
                                Submit Exam
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AuthenticatedLayout>
    );
};

export default ExamAttemptEdit;
