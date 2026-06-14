import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { PageProps, Paginated, ExamAttempt } from '@/types';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import Heading from '@/components/heading';
import { format } from 'date-fns';

type Props = PageProps<{
    attempts: Paginated<ExamAttempt>;
}>;

export default function ExamAttemptsIndex({ auth, attempts }: Props) {
    const breadcrumbs = [
        { title: 'Dashboard', href: route('dashboard') },
        { title: 'My Attempts', href: route('exams.attempts.index') },
    ];

    return (
        <AppLayout user={auth.user} breadcrumbs={breadcrumbs}>
            <Head title="My Exam Attempts" />

            <div className="flex flex-col gap-6">
                <Heading title="My Exam Attempts" description="Here are the results of your past exam attempts." />

                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Exam</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Score</TableHead>
                                <TableHead>Percentage</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {(attempts?.data || []).map((attempt) => (
                                <TableRow key={attempt.id}>
                                    <TableCell className="font-medium">{attempt.exam.name}</TableCell>
                                    <TableCell>
                                        <Badge variant={attempt.status === 'GRADED' ? 'default' : 'secondary'}>{attempt.status}</Badge>
                                    </TableCell>
                                    <TableCell>{attempt.total_score ?? 'N/A'}</TableCell>
                                    <TableCell>{attempt.percentage !== null ? `${attempt.percentage}%` : 'N/A'}</TableCell>
                                    <TableCell>{format(new Date(attempt.created_at), 'yyyy-MM-dd HH:mm')}</TableCell>
                                    <TableCell className="text-right">
                                        {attempt.status === 'GRADED' && (
                                            <Button asChild variant="outline" size="sm">
                                                <Link href={route('exams.attempts.show', attempt.id)}>
                                                    View Results
                                                </Link>
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {(!attempts?.data || attempts.data.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                                        You haven't attempted any exams yet.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </AppLayout>
    );
}
