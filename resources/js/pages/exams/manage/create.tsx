import React from 'react';
import { Head } from '@inertiajs/react';
import { PageProps } from '@/types';
import AppLayout from '@/layouts/app-layout';
import Heading from '@/components/heading';
import ExamForm from '@/pages/exams/manage/partials/exam-form';

const ExamsManageCreate: React.FC<PageProps> = ({ auth }) => {
    const breadcrumbs = [
        { title: 'Dashboard', href: route('dashboard') },
        { title: 'Exams', href: route('exams.manage.index') },
        { title: 'Create', href: route('exams.manage.create') },
    ];

    return (
        <AppLayout user={auth.user} breadcrumbs={breadcrumbs}>
            <Head title="Create Exam" />
            <div className="space-y-6">
                <Heading title="Create New Exam" description="Build a new exam with questions and answers." />
                <ExamForm />
            </div>
        </AppLayout>
    );
};

export default ExamsManageCreate;
