import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { PageProps, Exam } from '@/types';
import AppLayout from '@/layouts/app-layout';
import Heading from '@/components/heading';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ExamsIndexProps extends PageProps {
    exams: Exam[];
}

const ExamsIndex: React.FC<ExamsIndexProps> = ({ auth, exams }) => {
    const breadcrumbs = [
        { title: 'Dashboard', href: route('dashboard') },
        { title: 'Available Exams', href: route('exams.index') },
    ];

    return (
        <AppLayout user={auth.user} breadcrumbs={breadcrumbs}>
            <Head title="Available Exams" />
            <div className="space-y-6">
                <Heading title="Available Exams" description="Here are the exams available for you to take." />

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {(exams || []).map((exam) => (
                        <Card key={exam.id}>
                            <CardHeader>
                                <CardTitle>{exam.name}</CardTitle>
                                <CardDescription>
                                    Time limit: {exam.time_limit} minutes | Max attempts: {exam.max_attempts || 'Unlimited'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button asChild className="w-full">
                                    <Link href={route('exams.attempts.store', { exam: exam.id })} method="post" as="button">
                                        Start Exam
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                    {(!exams || exams.length === 0) && (
                        <div className="col-span-full text-center text-muted-foreground py-10">
                            <p>No exams are available at this time.</p>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
};

export default ExamsIndex;
