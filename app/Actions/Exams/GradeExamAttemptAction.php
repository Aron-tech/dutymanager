<?php

namespace App\Actions\Exams;

use App\Models\ExamAttempt;
use App\Models\ExamAttemptAnswer;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class GradeExamAttemptAction
{
    public function execute(ExamAttempt $examAttempt, array $data): void
    {
        DB::transaction(function () use ($examAttempt, $data) {
            $totalScore = 0;
            $maxScore = 0;

            foreach ($data['answers'] as $answerData) {
                /** @var ExamAttemptAnswer $answer */
                $answer = ExamAttemptAnswer::query()
                    ->where('exam_attempt_id', $examAttempt->id)
                    ->findOrFail($answerData['exam_attempt_answer_id']);

                $answer->update([
                    'points_awarded' => $answerData['points_awarded'],
                    'is_correct' => $answerData['is_correct'],
                    'feedback' => $answerData['feedback'] ?? null,
                ]);

                $totalScore += $answerData['points_awarded'];
                $maxScore += $answer->examQuestion->points ?? 0;
            }

            $percentage = $maxScore > 0 ? (int) round(($totalScore / $maxScore) * 100) : 0;

            $examAttempt->update([
                'status' => 'GRADED',
                'total_score' => $totalScore,
                'percentage' => $percentage,
                'graded_at' => Carbon::now(),
                'graded_by' => auth()->id(),
            ]);
        });
    }
}
