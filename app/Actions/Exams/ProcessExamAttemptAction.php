<?php

namespace App\Actions\Exams;

use App\Models\ExamAttempt;
use App\Models\ExamQuestion;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class ProcessExamAttemptAction
{
    public function execute(ExamAttempt $examAttempt, array $answersData): ExamAttempt
    {
        return DB::transaction(function () use ($examAttempt, $answersData) {
            $examAttempt->update([
                'completed_at' => Carbon::now(),
                'status' => 'PENDING', // Default to pending until graded
            ]);

            $exam = $examAttempt->exam;
            $questions = $exam->questions()->with('examQuestionAnswers')->get();

            $totalPoints = 0;
            $earnedPoints = 0;
            $needsManualGrading = false;

            foreach ($questions as $question) {
                $totalPoints += $question->points;
                $userAnswerData = $answersData[$question->id] ?? null;

                $attemptAnswer = $examAttempt->examAttemptAnswers()->create([
                    'exam_question_id' => $question->id,
                    'answer_text' => is_string($userAnswerData) ? $userAnswerData : null,
                ]);

                if ($question->type === 'text') {
                    $needsManualGrading = true;
                    continue;
                }

                // Handle single-choice and multiple-choice
                $isCorrect = false;

                if ($question->type === 'single-choice') {
                    if ($userAnswerData) {
                        $attemptAnswer->examAttemptAnswerSelections()->create([
                            'exam_question_answer_id' => (int) $userAnswerData,
                        ]);
                        $correctAnswerId = $question->examQuestionAnswers->where('is_correct', true)->first()?->id;
                        $isCorrect = ((int) $userAnswerData === $correctAnswerId);
                    }
                } elseif ($question->type === 'multiple-choice') {
                    if (is_array($userAnswerData)) {
                        $selectedAnswerIds = collect($userAnswerData)
                            ->filter(fn($checked) => $checked)
                            ->keys()
                            ->map(fn($id) => (int) $id)
                            ->toArray();

                        foreach ($selectedAnswerIds as $answerId) {
                            $attemptAnswer->examAttemptAnswerSelections()->create([
                                'exam_question_answer_id' => $answerId,
                            ]);
                        }

                        $correctAnswerIds = $question->examQuestionAnswers->where('is_correct', true)->pluck('id')->toArray();

                        // Check if selected answers exactly match correct answers
                        sort($selectedAnswerIds);
                        sort($correctAnswerIds);
                        $isCorrect = ($selectedAnswerIds === $correctAnswerIds);
                    }
                }

                $attemptAnswer->update([
                    'is_correct' => $isCorrect,
                    'points_awarded' => $isCorrect ? $question->points : 0,
                ]);

                if ($isCorrect) {
                    $earnedPoints += $question->points;
                }
            }

            if (!$needsManualGrading) {
                $examAttempt->update([
                    'status' => 'GRADED',
                ]);
                $examAttempt->grade()->create([
                    'score' => $earnedPoints,
                    'max_score' => $totalPoints,
                    'passed' => ($earnedPoints / $totalPoints) >= 0.5, // Assuming 50% pass mark for auto-grading
                    'graded_by' => null, // Auto-graded
                    'graded_at' => Carbon::now(),
                ]);
            }

            return $examAttempt;
        });
    }
}
