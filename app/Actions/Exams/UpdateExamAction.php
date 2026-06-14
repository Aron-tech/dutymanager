<?php

namespace App\Actions\Exams;

use App\Models\Exam;
use Illuminate\Support\Facades\DB;

class UpdateExamAction
{
    public function execute(Exam $exam, array $data): Exam
    {
        return DB::transaction(function () use ($exam, $data) {
            $exam->update([
                'name' => $data['name'],
                'is_active' => $data['is_active'],
                'time_limit' => $data['time_limit'],
                'max_attempts' => $data['max_attempts'],
            ]);

            // Simple update strategy: sync questions/answers based on IDs.
            // For a robust system, you would delete missing IDs and update existing ones.
            // Here, we recreate questions and answers for simplicity or update existing ones
            // Let's implement a clean sync strategy

            $existingQuestionIds = collect($data['questions'])->pluck('id')->filter()->toArray();
            $exam->questions()->whereNotIn('id', $existingQuestionIds)->delete();

            foreach ($data['questions'] as $questionData) {
                $question = $exam->questions()->updateOrCreate(
                    ['id' => $questionData['id'] ?? null],
                    [
                        'text' => $questionData['text'],
                        'type' => $questionData['type'],
                        'points' => $questionData['points'],
                    ]
                );

                if (isset($questionData['answers'])) {
                    $existingAnswerIds = collect($questionData['answers'])->pluck('id')->filter()->toArray();
                    $question->examQuestionAnswers()->whereNotIn('id', $existingAnswerIds)->delete();

                    foreach ($questionData['answers'] as $answerData) {
                        $question->examQuestionAnswers()->updateOrCreate(
                            ['id' => $answerData['id'] ?? null],
                            [
                                'text' => $answerData['text'],
                                'is_correct' => $answerData['is_correct'],
                            ]
                        );
                    }
                } else {
                    $question->examQuestionAnswers()->delete();
                }
            }

            return $exam;
        });
    }
}
