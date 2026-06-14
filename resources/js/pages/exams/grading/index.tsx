import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { PageProps, ExamAttempt } from '@/types';
import AppLayout from '@/layouts/app-layout';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface GradingIndexProps extends PageProps {
    pending_attempts: {
        data: ExamAttempt[];
    };
}

const GradingIndex: React.FC<GradingIndexProps> = ({ auth, pending_attempts }) => {
    const breadcrumbs = [
        { title: 'Dashboard', href: route('dashboard') },
        { title: 'Exam Grading', href: route('exams.grading.index') },
    ];

    return (
        <AppLayout user={auth.user} breadcrumbs={breadcrumbs}>
            <Head title="Exam Grading" />
            <div className="space-y-6">
                <Heading title="Pending Exam Attempts" description="Review and grade submitted exams." />

                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Exam</TableHead>
                                <TableHead>User</TableHead>
                                <TableHead>Submitted At</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {(pending_attempts?.data || []).map((attempt) => (
                                <TableRow key={attempt.id}>
                                    <TableCell className="font-medium">{attempt.exam.name}</TableCell>
                                    <TableCell>{attempt.guild_user.user.name}</TableCell>
                                    <TableCell>{format(new Date(attempt.completed_at), 'yyyy-MM-dd HH:mm')}</TableCell>
                                    <TableCell>
                                        <Badge variant="yellow">{attempt.status}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button asChild variant="outline" size="sm">
                                            <Link href={route('exams.grading.show', attempt.id)}>Grade</Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {(!pending_attempts?.data || pending_attempts.data.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                                        No pending attempts to grade.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </AppLayout>
    );
};

export default GradingIndex;
