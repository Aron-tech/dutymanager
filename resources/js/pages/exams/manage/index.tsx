import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { PageProps, Exam } from '@/types';
import AppLayout from '@/layouts/app-layout';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface ExamsManageIndexProps extends PageProps {
    exams: {
        data: Exam[];
    };
}

const ExamsManageIndex: React.FC<ExamsManageIndexProps> = ({ auth, exams }) => {
    const breadcrumbs = [
        { title: 'Dashboard', href: route('dashboard') },
        { title: 'Exams', href: route('exams.manage.index') },
    ];

    return (
        <AppLayout user={auth.user} breadcrumbs={breadcrumbs}>
            <Head title="Manage Exams" />

            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <Heading title="Manage Exams" description="Create, edit, and manage exams." />
                    <Button asChild>
                        <Link href={route('exams.manage.create')}>Create Exam</Link>
                    </Button>
                </div>

                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Questions</TableHead>
                                <TableHead>Attempts</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {(exams?.data || []).map((exam) => (
                                <TableRow key={exam.id}>
                                    <TableCell className="font-medium">{exam.name}</TableCell>
                                    <TableCell>
                                        <Badge variant={exam.is_active ? 'default' : 'secondary'}>
                                            {exam.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{exam.questions_count}</TableCell>
                                    <TableCell>{exam.attempts_count}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={route('exams.manage.edit', exam.id)}>Edit</Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {(!exams?.data || exams.data.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                                        No exams found.
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

export default ExamsManageIndex;
