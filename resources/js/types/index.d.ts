import { User } from './user';
import { GuildUser } from './guild-user';

export * from './user';
export * from './guild';
export * from './guild-user';
export * from './duty';
export * from './punishment';
export * from './holiday';
export * from './item';
export * from './activity-log';

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user: User;
    };
    flash: {
        message: string | null;
    };
};

export type Paginated<T> = {
    data: T[];
    links: {
        first: string;
        last: string;
        prev: string | null;
        next: string | null;
    };
    meta: {
        current_page: number;
        from: number;
        last_page: number;
        links: {
            url: string | null;
            label: string;
            active: boolean;
        }[];
        path: string;
        per_page: number;
        to: number;
        total: number;
    };
};

export interface Exam {
    id: number;
    title: string;
    description: string;
    created_at: string;
    updated_at: string;
}

export interface ExamQuestion {
    id: number;
    exam_id: number;
    question: string;
    points: number;
    exam_question_answers: ExamQuestionAnswer[];
    created_at: string;
    updated_at: string;
}

export interface ExamQuestionAnswer {
    id: number;
    exam_question_id: number;
    answer: string;
    is_correct: boolean;
    created_at: string;
    updated_at: string;
}

export interface ExamAttempt {
    id: number;
    exam_id: number;
    guild_user_id: number;
    status: 'PENDING' | 'GRADED' | 'IN_PROGRESS';
    total_score: number | null;
    percentage: number | null;
    graded_at: string | null;
    graded_by: number | null;
    created_at: string;
    updated_at: string;
    exam: Exam;
    guild_user: GuildUser;
    exam_attempt_answers: ExamAttemptAnswer[];
    grader?: User;
}

export interface ExamAttemptAnswer {
    id: number;
    exam_attempt_id: number;
    exam_question_id: number;
    answer: string;
    earned_score: number | null;
    is_correct: boolean | null;
    teacher_comment: string | null;
    is_manually_graded: boolean;
    created_at: string;
    updated_at: string;
    exam_question: ExamQuestion;
}
