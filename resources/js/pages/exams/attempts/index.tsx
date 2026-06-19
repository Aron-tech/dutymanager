import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import {
    GraduationCap,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    ChevronRight,
    Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { DataTable } from '@/components/data-table';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface ExamAttempt {
    id: number;
    exam_id: number;
    guild_id: string;
    user_id: string;
    score: number | null;
    status: string;
    created_at: string;
    exam: {
        id: number;
        name: string;
        min_percent: number;
    };
    user: {
        id: string;
        name: string;
        avatar?: string;
        avatar_url?: string;
    };
    guild_user?: {
        nickname?: string;
    };
}

interface IndexProps {
    attempts: ExamAttempt[];
}

export default function Index({ attempts }: IndexProps) {
    const { props } = usePage();
    const getInitials = useInitials();

    const [search_query, setSearchQuery] = useState('');
    const [status_filter, setStatusFilter] = useState('all');
    const [sort_column, setSortColumn] = useState('created_at');
    const [sort_direction, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [selected_ids, setSelectedIds] = useState<(string | number)[]>([]);
    const [bulk_status, setBulkStatus] = useState<string>('');
    const [is_delete_dialog_open, setIsDeleteDialogOpen] = useState(false);
    const [is_deleting, setIsDeleting] = useState(false);

    const handleBulkStatusChange = (status: string) => {
        if (selected_ids.length === 0) return;
        router.post(
            route('exams.attempts.bulk-status'),
            { ids: selected_ids, status },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSelectedIds([]);
                    setBulkStatus('');
                },
            },
        );
    };

    const handleBulkDelete = () => {
        setIsDeleting(true);
        router.post(
            route('exams.attempts.bulk-delete'),
            { ids: selected_ids },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSelectedIds([]);
                    setIsDeleteDialogOpen(false);
                },
                onFinish: () => {
                    setIsDeleting(false);
                },
            },
        );
    };

    const __ = (
        key: string,
        replace: Record<string, string | number> = {},
    ): string => {
        const parts = key.split('.');
        let translation: any = props.translations;

        for (const part of parts) {
            if (translation && translation[part] !== undefined) {
                translation = translation[part];
            } else {
                translation = key;
                break;
            }
        }

        if (typeof translation !== 'string') {
            return key;
        }

        Object.keys(replace).forEach((token) => {
            translation = translation.replace(
                `:${token}`,
                String(replace[token]),
            );
        });

        return translation;
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('hu-HU', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusBadge = (attempt: ExamAttempt) => {
        switch (attempt.status) {
            case 'graded':
                const passed =
                    attempt.score !== null &&
                    attempt.score >= attempt.exam.min_percent;
                return (
                    <Badge
                        variant={passed ? 'default' : 'destructive'}
                        className="gap-1.5 px-2.5 py-1"
                    >
                        {passed ? (
                            <>
                                <CheckCircle2 className="h-3 w-3" />
                                {__('exam.success_score')} ({attempt.score}%)
                            </>
                        ) : (
                            <>
                                <XCircle className="h-3 w-3" />
                                {__('exam.failed_score')} ({attempt.score}%)
                            </>
                        )}
                    </Badge>
                );
            case 'failed':
                return (
                    <Badge
                        variant="destructive"
                        className="gap-1.5 px-2.5 py-1"
                    >
                        <XCircle className="h-3 w-3" />
                        {__('exam.failed_score')}
                    </Badge>
                );
            case 'pending':
            default:
                return (
                    <Badge
                        variant="secondary"
                        className="gap-1.5 border border-yellow-500/20 bg-yellow-500/10 px-2.5 py-1 text-yellow-500 hover:bg-yellow-500/15"
                    >
                        <AlertCircle className="h-3 w-3" />
                        {__('exam.pending_grading')}
                    </Badge>
                );
        }
    };

    const handleSort = (columnId: string) => {
        if (sort_column === columnId) {
            setSortDirection(sort_direction === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(columnId);
            setSortDirection('asc');
        }
    };

    const filteredAndSortedAttempts = useMemo(() => {
        let result = [...attempts];

        // 1. Filter by Search Query (username or user_id)
        if (search_query.trim() !== '') {
            const query = search_query.toLowerCase();
            result = result.filter((attempt) => {
                const userName = (
                    attempt.guild_user?.nickname || attempt.user.name
                ).toLowerCase();
                const userId = attempt.user.id.toLowerCase();
                return userName.includes(query) || userId.includes(query);
            });
        }

        // 2. Filter by Status
        if (status_filter !== 'all') {
            result = result.filter((attempt) => {
                if (status_filter === 'graded_passed') {
                    return (
                        attempt.status === 'graded' &&
                        attempt.score !== null &&
                        attempt.score >= attempt.exam.min_percent
                    );
                }
                if (status_filter === 'graded_failed') {
                    return (
                        (attempt.status === 'graded' &&
                            (attempt.score === null ||
                                attempt.score < attempt.exam.min_percent)) ||
                        attempt.status === 'failed'
                    );
                }
                return attempt.status === status_filter;
            });
        }

        // 3. Sort
        result.sort((a, b) => {
            let aValue: any = '';
            let bValue: any = '';

            if (sort_column === 'user') {
                aValue = a.guild_user?.nickname || a.user.name;
                const bUserName = b.guild_user?.nickname || b.user.name;
                if (aValue.toLowerCase() < bUserName.toLowerCase()) {
                    return sort_direction === 'asc' ? -1 : 1;
                }
                if (aValue.toLowerCase() > bUserName.toLowerCase()) {
                    return sort_direction === 'asc' ? 1 : -1;
                }
                return 0;
            } else if (sort_column === 'exam') {
                aValue = a.exam.name;
                bValue = b.exam.name;
            } else if (sort_column === 'created_at') {
                aValue = new Date(a.created_at).getTime();
                bValue = new Date(b.created_at).getTime();
            } else if (sort_column === 'score') {
                aValue = a.score ?? -1;
                bValue = b.score ?? -1;
            } else {
                aValue = a[sort_column as keyof ExamAttempt] ?? '';
                bValue = b[sort_column as keyof ExamAttempt] ?? '';
            }

            if (aValue < bValue) {
                return sort_direction === 'asc' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sort_direction === 'asc' ? 1 : -1;
            }
            return 0;
        });

        return result;
    }, [attempts, search_query, status_filter, sort_column, sort_direction]);

    const columns = [
        {
            id: 'user',
            label: __('exam.user'),
            sortable: true,
            render: (row: ExamAttempt) => {
                const userName = row.guild_user?.nickname || row.user.name;
                return (
                    <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8 shrink-0 overflow-hidden rounded-full">
                            <AvatarImage
                                src={row.user.avatar_url}
                                alt={userName}
                            />
                            <AvatarFallback className="rounded-full bg-neutral-200 text-xs text-black dark:bg-neutral-700 dark:text-white">
                                {getInitials(userName)}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="text-sm font-semibold text-foreground">
                                {userName}
                            </p>
                            <p className="text-[10px]">ID: {row.user.id}</p>
                        </div>
                    </div>
                );
            },
        },
        {
            id: 'exam',
            label: __('exam.title'),
            sortable: true,
            render: (row: ExamAttempt) => (
                <span className="font-medium text-foreground">
                    {row.exam.name}
                </span>
            ),
        },
        {
            id: 'created_at',
            label: __('exam.date'),
            sortable: true,
            render: (row: ExamAttempt) => (
                <div className="flex items-center gap-1.5 text-xs">
                    <Clock className="h-3.5 w-3.5" />
                    {formatDate(row.created_at)}
                </div>
            ),
        },
        {
            id: 'score',
            label: __('exam.score_status'),
            sortable: true,
            render: (row: ExamAttempt) => getStatusBadge(row),
        },
    ];

    const actions = (row: ExamAttempt) => (
        <Button asChild size="sm" variant="outline">
            <Link href={route('exams.attempts.show', row.id)}>
                {__('exam.grade_exam')}
                <ChevronRight className="h-3.5 w-3.5" />
            </Link>
        </Button>
    );

    return (
        <AppLayout>
            <Head title={__('exam.attempts_list')} />

            <div className="animate-fade-in container mx-auto space-y-8 p-6">
                <div className="flex items-center justify-between border-b border-border/40 pb-6">
                    <div>
                        <h1 className="bg-linear-to-r from-primary to-indigo-400 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent">
                            {__('exam.attempts_list')}
                        </h1>
                        <p className="mt-1 text-sm">
                            {__('exam.attempts_list_desc')}
                        </p>
                    </div>
                </div>

                <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                    <Input
                        placeholder={__('exam.search_placeholder')}
                        value={search_query}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="max-w-md bg-card"
                    />
                    <Select
                        value={status_filter}
                        onValueChange={setStatusFilter}
                    >
                        <SelectTrigger className="w-full bg-card sm:w-50">
                            <SelectValue placeholder={__('exam.status')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">
                                {__('exam.all_status')}
                            </SelectItem>
                            <SelectItem value="pending">
                                {__('exam.pending_grading')}
                            </SelectItem>
                            <SelectItem value="graded_passed">
                                {__('exam.success_score')}
                            </SelectItem>
                            <SelectItem value="graded_failed">
                                {__('exam.failed_score')}
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {selected_ids.length > 0 && (
                    <div className="flex animate-in flex-col gap-4 rounded-xl border border-primary/20 bg-primary/5 p-4 shadow-md duration-300 fade-in slide-in-from-top-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/25 text-xs font-semibold text-primary">
                                {selected_ids.length}
                            </span>
                            <span>kijelölt próbálkozás</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <Select
                                value={bulk_status}
                                onValueChange={handleBulkStatusChange}
                            >
                                <SelectTrigger className="h-9 w-full bg-card text-xs sm:w-48">
                                    <SelectValue placeholder="Állapot módosítása..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pending">
                                        {__('exam.pending_grading') ||
                                            'Javításra vár'}
                                    </SelectItem>
                                    <SelectItem value="graded">
                                        {__('exam.status_graded') || 'Javított'}
                                    </SelectItem>
                                    <SelectItem value="failed">
                                        {__('exam.status_failed') ||
                                            'Sikertelen'}
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <Button
                                variant="destructive"
                                size="sm"
                                className="h-9 gap-2 text-xs font-semibold"
                                onClick={() => setIsDeleteDialogOpen(true)}
                            >
                                <Trash2 className="h-4 w-4" />
                                Kijelöltek törlése
                            </Button>
                        </div>
                    </div>
                )}

                <Card className="border-border/60 bg-linear-to-br from-card to-background shadow-lg">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-lg font-bold">
                            <GraduationCap className="h-5 w-5 text-primary" />
                            {__('exam.submitted_attempts')}
                        </CardTitle>
                        <CardDescription>
                            {__('exam.submitted_attempts_desc')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <DataTable<ExamAttempt>
                            data={filteredAndSortedAttempts}
                            columns={columns}
                            key_field="id"
                            selected_rows={selected_ids}
                            onSelectionChange={setSelectedIds}
                            is_row_selectable={() => true}
                            sort_column={sort_column}
                            sort_direction={sort_direction}
                            onSort={handleSort}
                            actions={actions}
                            empty_message={
                                __('exam.no_submitted_attempts') ||
                                'Nincsenek beküldött vizsgák.'
                            }
                        />
                    </CardContent>
                </Card>

                <ConfirmDeleteDialog
                    isOpen={is_delete_dialog_open}
                    onClose={() => setIsDeleteDialogOpen(false)}
                    onConfirm={handleBulkDelete}
                    isProcessing={is_deleting}
                    title="Vizsga próbálkozások törlése"
                    description={`Biztosan törölni szeretne ${selected_ids.length} kijelölt vizsga próbálkozást? Ez a művelet nem vonható vissza.`}
                    confirmText="Törlés"
                    cancelText="Mégse"
                />
            </div>
        </AppLayout>
    );
}
