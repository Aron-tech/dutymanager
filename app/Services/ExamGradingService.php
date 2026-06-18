<?php

namespace App\Services;

use App\Models\ExamAttempt;

class ExamGradingService
{
    /**
     * Constructor using promoted properties.
     */
    public function __construct(
        protected readonly RoleAssignmentService $role_assignment_service
    ) {}

    /**
     * Evaluates the exam attempt, updates score and status, and triggers role assignment.
     */
    public function evaluateAttempt(ExamAttempt $attempt): void
    {
        $exam = $attempt->exam;
        $questions = $exam->questions;
        $total_points = 0;
        $earned_points = 0;

        $submitted_answers = $attempt->getData('answers', $attempt->data ?? []);

        foreach ($questions as $question) {
            $total_points += $question->points;
            $question_id = $question->id;
            $submitted_answer = $submitted_answers[$question_id] ?? null;

            if ($submitted_answer === null) {
                continue;
            }

            $is_correct = false;
            $content = $question->content ?? [];

            switch ($question->type) {
                case 'multiple_choice':
                    $correct_option = $content['correct_answer'] ?? $content['correct_option_id'] ?? $content['correct_options'] ?? null;
                    if (is_array($correct_option)) {
                        if (is_array($submitted_answer)) {
                            sort($correct_option);
                            sort($submitted_answer);
                            $is_correct = ($correct_option === $submitted_answer);
                        }
                    } else {
                        $is_correct = (string) $correct_option === (string) $submitted_answer;
                    }
                    break;

                case 'true_false':
                    $correct_value = $content['correct_answer'] ?? $content['correct'] ?? null;
                    $is_correct = filter_var($correct_value, FILTER_VALIDATE_BOOLEAN) === filter_var($submitted_answer, FILTER_VALIDATE_BOOLEAN);
                    break;

                case 'matching':
                    $correct_pairs = $content['correct_pairs'] ?? $content['pairs'] ?? $content['matches'] ?? [];
                    if (is_array($correct_pairs) && is_array($submitted_answer)) {
                        $match = true;
                        foreach ($correct_pairs as $key => $val) {
                            if (! isset($submitted_answer[$key]) || (string) $submitted_answer[$key] !== (string) $val) {
                                $match = false;
                                break;
                            }
                        }
                        if ($match && count($correct_pairs) === count($submitted_answer)) {
                            $is_correct = true;
                        }
                    }
                    break;

                case 'free_text':
                    $correct_answer = $content['correct_answer'] ?? null;
                    if ($correct_answer !== null && $submitted_answer !== null) {
                        $is_correct = strtolower(trim((string) $submitted_answer)) === strtolower(trim((string) $correct_answer));
                    }
                    break;

                case 'cloze':
                    $correct_answers = $content['correct_answers'] ?? [];
                    if (is_array($correct_answers) && is_array($submitted_answer)) {
                        $match = true;
                        foreach ($correct_answers as $key => $val) {
                            if (! isset($submitted_answer[$key]) || strtolower(trim((string) $submitted_answer[$key])) !== strtolower(trim((string) $val))) {
                                $match = false;
                                break;
                            }
                        }
                        if ($match && count($correct_answers) === count($submitted_answer)) {
                            $is_correct = true;
                        }
                    }
                    break;
            }

            if ($is_correct) {
                $earned_points += $question->points;
            }
        }

        $score_percentage = $total_points > 0 ? (int) round(($earned_points / $total_points) * 100) : 0;

        $attempt->score = $score_percentage;
        $attempt->status = 'graded';
        $attempt->save();

        $this->role_assignment_service->assignPassedRoles($attempt);
    }
}
