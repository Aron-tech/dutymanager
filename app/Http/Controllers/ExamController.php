<?php

namespace App\Http\Controllers;

use App\Actions\Exams\CreateExamAction;
use App\Actions\Exams\UpdateExamAction;
use App\Http\Requests\Exams\StoreExamRequest;
use App\Http\Requests\Exams\UpdateExamRequest;
use App\Models\Exam;
use App\Services\SelectedGuildService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ExamController extends Controller
{
    public function index(): Response
    {
        $exams = Exam::query()
            ->where('guild_id', auth()->user()->selected_guild_id)
            ->where('exams.visible', true)
            ->get();

        return Inertia::render('exams/index', [
            'exams' => $exams,
        ]);
    }

    public function adminIndex(): Response
    {
        $guild = SelectedGuildService::get();

        $exams = Exam::query()
            ->where('guild_id', $guild->id)
            ->withCount(['attempts', 'examQuestions'])
            ->latest()
            ->paginate(15);

        return Inertia::render('exams/manage/index', [
            'exams' => $exams,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('exams/manage/create');
    }

    public function store(StoreExamRequest $request, CreateExamAction $action): RedirectResponse
    {
        $action->execute($request->validated());

        return redirect()->route('exams.manage.index');
    }

    public function edit(Exam $exam): Response
    {
        $exam->load('questions.examQuestionAnswers');

        return Inertia::render('exams/manage/edit', [
            'exam' => $exam,
        ]);
    }

    public function update(UpdateExamRequest $request, Exam $exam, UpdateExamAction $action): RedirectResponse
    {
        $action->execute($exam, $request->validated());

        return redirect()->route('exams.manage.index');
    }

    public function destroy(Exam $exam): RedirectResponse
    {
        $exam->delete();

        return redirect()->route('exams.manage.index');
    }
}
