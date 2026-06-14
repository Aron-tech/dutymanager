import React from 'react';
import { Head } from '@inertiajs/react';
import { PageProps, ExamAttempt } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import Heading from '@/components/heading';
import { format } from 'date-fns';

type Props = PageProps<{
    exam_attempt: ExamAttempt;
}>;

export default function ExamAttemptsShow({ auth, exam_attempt }: Props) {
    const breadcrumbs = [
        { title: 'Dashboard', href: route('dashboard') },
        { title: 'My Attempts', href: route('exams.attempts.index') },
        { title: 'Results', href: route('exams.attempts.show', exam_attempt.id) },
    ];

    const renderUserAnswer = (answer: any) => {
        if (answer.answer_text) {
            return <p>{answer.answer_text}</p>;
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
        return <p className="italic text-muted-foreground">No answer provided.</p>;
    };

    return (
        <AppLayout user={auth.user} breadcrumbs={breadcrumbs}>
            <Head title={`Exam Results: ${exam_attempt.exam.name}`} />

            <div className="flex flex-col gap-6">
                <Heading
                    title={`Results: ${exam_attempt.exam.name}`}
                    description={`Taken on ${format(new Date(exam_attempt.created_at), 'PPP')}`}
                />

                <Card>
                    <CardHeader>
                        <CardTitle>Attempt Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <div>
                                <p className="text-sm text-muted-foreground">Status</p>
                                <Badge variant={exam_attempt.status === 'GRADED' ? 'default' : 'secondary'}>{exam_attempt.status}</Badge>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total Score</p>
                                <p className="text-lg font-semibold">{exam_attempt.total_score ?? 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Percentage</p>
                                <p className="text-lg font-semibold">{exam_attempt.percentage !== null ? `${exam_attempt.percentage}%` : 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Graded By</p>
                                <p className="text-lg font-semibold">
                                    {exam_attempt.grader?.name ?? 'Auto-graded'}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    {exam_attempt.exam_attempt_answers.map((answer, index) => (
                        <Card key={answer.id}>
                            <CardHeader className="bg-muted/50 pb-4">
                                <div className="flex justify-between items-start">
                                    <CardTitle className="text-lg">
                                        {index + 1}. {answer.exam_question.text}
                                    </CardTitle>
                                    <div className="flex items-center space-x-2 shrink-0">
                                        <Badge variant={answer.is_correct ? 'default' : 'destructive'}>
                                            {answer.is_correct ? 'Correct' : 'Incorrect'}
                                        </Badge>
                                        <span className="text-sm font-medium">
                                            {answer.points_awarded ?? 0} / {answer.exam_question.points} pts
                                        </span>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-4">
                                <div>
                                    <p className="text-sm font-semibold text-muted-foreground mb-2">Your Answer:</p>
                                    <div className="p-3 bg-secondary/50 rounded-md">
                                        {renderUserAnswer(answer)}
                                    </div>
                                </div>

                                {answer.exam_question.exam_question_answers && answer.exam_question.exam_question_answers.length > 0 && (
                                   <div>
                                        <p className="text-sm font-semibold text-muted-foreground mb-2">Correct Answer(s):</p>
                                        <ul className="list-disc list-inside p-3 bg-green-50 dark:bg-green-900/20 text-green-900 dark:text-green-100 rounded-md text-sm">
                                            {answer.exam_question.exam_question_answers.filter(qa => qa.is_correct).map(qa => (
                                                <li key={qa.id}>{qa.text}</li>
                                            ))}
                                        </ul>
                                   </div>
                                )}

                                {answer.feedback && (
                                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded-md">
                                        <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">Teacher's Feedback:</p>
                                        <p className="text-sm text-blue-800 dark:text-blue-200">{answer.feedback}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}
