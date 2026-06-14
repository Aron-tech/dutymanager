<?php

namespace App\Http\Controllers\Exams;

use App\Actions\Exams\GradeExamAttemptAction;
use App\Enums\PermissionEnum;
use App\Http\Controllers\Controller;
use App\Http\Requests\Exams\UpdateExamGradeRequest;
use App\Models\ExamAttempt;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ExamGradingController extends Controller
{
    public function index(): Response
    {
        if (auth()->user()->cannot(PermissionEnum::MANAGE_EXAMS->value)) {
            abort(403);
        }

        $pending_attempts = ExamAttempt::query()
            ->with(['guildUser.user', 'exam'])
            ->where('status', 'PENDING')
            ->latest()
            ->paginate(15);

        return Inertia::render('exams/grading/index', [
            'pending_attempts' => $pending_attempts,
        ]);
    }

    public function show(ExamAttempt $exam_attempt): Response
    {
        if (auth()->user()->cannot(PermissionEnum::MANAGE_EXAMS->value)) {
            abort(403);
        }

        $exam_attempt->load([
            'exam',
            'guildUser.user',
            'examAttemptAnswers.examQuestion.examQuestionAnswers'
        ]);

        return Inertia::render('exams/grading/show', [
            'exam_attempt' => $exam_attempt,
        ]);
    }

    public function update(UpdateExamGradeRequest $request, ExamAttempt $exam_attempt, GradeExamAttemptAction $action): RedirectResponse
    {
        if (auth()->user()->cannot(PermissionEnum::MANAGE_EXAMS->value)) {
            abort(403);
        }

        $action->execute($exam_attempt, $request->validated());

        return redirect()->route('exams.grading.index');
    }
}
