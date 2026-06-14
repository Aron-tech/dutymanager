<?php

namespace App\Http\Controllers\Exams;

use App\Actions\Exams\CreateExamAction;
use App\Actions\Exams\UpdateExamAction;
use App\Enums\PermissionEnum;
use App\Http\Controllers\Controller;
use App\Http\Requests\Exams\StoreExamRequest;
use App\Http\Requests\Exams\UpdateExamRequest;
use App\Models\Exam;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ExamController extends Controller
{
    public function index(): Response
    {
        $exams = Exam::query()
            ->where('guild_id', auth()->user()->selected_guild_id)
            ->where('is_active', true)
            ->latest()
            ->paginate(15);

        return Inertia::render('exams/index', [
            'exams' => $exams,
        ]);
    }

    public function manageIndex(): Response
    {
        if (auth()->user()->cannot(PermissionEnum::MANAGE_EXAMS->value)) {
            abort(403);
        }

        $exams = Exam::query()
            ->where('guild_id', auth()->user()->selected_guild_id)
            ->withCount(['attempts', 'questions'])
            ->latest()
            ->paginate(15);

        return Inertia::render('exams/manage/index', [
            'exams' => $exams,
        ]);
    }

    public function create(): Response
    {
        if (auth()->user()->cannot(PermissionEnum::MANAGE_EXAMS->value)) {
            abort(403);
        }

        return Inertia::render('exams/manage/create');
    }

    public function store(StoreExamRequest $request, CreateExamAction $action): RedirectResponse
    {
        if (auth()->user()->cannot(PermissionEnum::MANAGE_EXAMS->value)) {
            abort(403);
        }

        $action->execute($request->validated());

        return redirect()->route('exams.manage.index');
    }

    public function edit(Exam $exam): Response
    {
        if (auth()->user()->cannot(PermissionEnum::MANAGE_EXAMS->value)) {
            abort(403);
        }

        $exam->load('questions.examQuestionAnswers');

        return Inertia::render('exams/manage/edit', [
            'exam' => $exam,
        ]);
    }

    public function update(UpdateExamRequest $request, Exam $exam, UpdateExamAction $action): RedirectResponse
    {
        if (auth()->user()->cannot(PermissionEnum::MANAGE_EXAMS->value)) {
            abort(403);
        }

        $action->execute($exam, $request->validated());

        return redirect()->route('exams.manage.index');
    }

    public function destroy(Exam $exam): RedirectResponse
    {
        if (auth()->user()->cannot(PermissionEnum::MANAGE_EXAMS->value)) {
            abort(403);
        }

        $exam->delete();

        return redirect()->route('exams.manage.index');
    }
}
