<?php

namespace App\Http\Controllers\Exams;

use App\Actions\Exams\ProcessExamAttemptAction;
use App\Http\Controllers\Controller;
use App\Models\Exam;
use App\Models\ExamAttempt;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ExamAttemptController extends Controller
{
    public function index(): Response
    {
        $user_attempts = ExamAttempt::query()
            ->with('exam')
            ->whereHas('guildUser', function ($query) {
                $query->where('user_id', auth()->id());
            })
            ->latest()
            ->paginate(15);

        return Inertia::render('exams/attempts/index', [
            'attempts' => $user_attempts,
        ]);
    }

    public function store(Request $request, Exam $exam): RedirectResponse
    {
        $guildUser = $request->user()->guildUsers()->where('guild_id', $exam->guild_id)->firstOrFail();

        $new_attempt = ExamAttempt::create([
            'exam_id' => $exam->id,
            'guild_user_id' => $guildUser->id,
            'started_at' => Carbon::now(),
            'status' => 'IN_PROGRESS',
        ]);

        return redirect()->route('exams.attempts.edit', $new_attempt);
    }

    public function show(ExamAttempt $exam_attempt): Response
    {
        if ($exam_attempt->guildUser->user_id !== auth()->id()) {
            abort(403);
        }

        $exam_attempt->load([
            'exam',
            'examAttemptAnswers.examQuestion.examQuestionAnswers',
            'grader',
        ]);

        return Inertia::render('exams/attempts/show', [
            'exam_attempt' => $exam_attempt,
        ]);
    }

    public function edit(ExamAttempt $exam_attempt): Response
    {
        if ($exam_attempt->guildUser->user_id !== auth()->id()) {
            abort(403);
        }

        if ($exam_attempt->status !== 'IN_PROGRESS') {
            return redirect()->route('exams.attempts.show', $exam_attempt);
        }

        $exam_attempt->load('exam.questions.examQuestionAnswers');

        return Inertia::render('exams/attempts/edit', [
            'exam_attempt' => $exam_attempt,
        ]);
    }

    public function update(Request $request, ExamAttempt $exam_attempt, ProcessExamAttemptAction $action): RedirectResponse
    {
        if ($exam_attempt->guildUser->user_id !== auth()->id()) {
            abort(403);
        }

        $action->execute($exam_attempt, $request->input('answers', []));

        return redirect()->route('exams.attempts.show', $exam_attempt);
    }
}
