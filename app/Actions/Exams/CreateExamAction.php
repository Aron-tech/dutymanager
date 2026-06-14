<?php

namespace App\Actions\Exams;

use App\Models\Exam;
use Illuminate\Support\Facades\DB;

class CreateExamAction
{
    public function execute(array $data): Exam
    {
        return DB::transaction(function () use ($data) {
            $exam = Exam::create([
                'name' => $data['name'],
                'is_active' => $data['is_active'],
                'time_limit' => $data['time_limit'],
                'max_attempts' => $data['max_attempts'],
                'guild_id' => auth()->user()->selected_guild_id,
            ]);

            foreach ($data['questions'] as $questionData) {
                $question = $exam->questions()->create([
                    'text' => $questionData['text'],
                    'type' => $questionData['type'],
                    'points' => $questionData['points'],
                ]);

                if (isset($questionData['answers'])) {
                    foreach ($questionData['answers'] as $answerData) {
                        $question->examQuestionAnswers()->create([
                            'text' => $answerData['text'],
                            'is_correct' => $answerData['is_correct'],
                        ]);
                    }
                }
            }

            return $exam;
        });
    }
}
