<?php

namespace App\Http\Controllers;

use App\Enums\ActionTypeEnum;
use App\Enums\PermissionEnum;
use App\Http\Requests\StoreExamRequest;
use App\Http\Requests\UpdateExamRequest;
use App\Models\ActivityLog;
use App\Models\Exam;
use App\Models\ExamAttempt;
use App\Services\DiscordFetchService;
use App\Services\ExamGradingService;
use App\Services\SelectedGuildService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class ExamController extends Controller
{
    /**
     * Constructor using promoted properties.
     */
    public function __construct(
        protected readonly ExamGradingService $grading_service
    ) {}

    /**
     * Display a listing of the exams.
     */
    public function index(): Response
    {
        if (auth()->user()->cannot(PermissionEnum::TAKE_EXAMS)) {
            abort(403, __('app.error_no_permission'));
        }

        $guild = SelectedGuildService::get();
        $guild_user = $guild->acceptedGuildUsers()->where('user_id', auth()->id())->first();
        $user_roles = $guild_user ? ($guild_user->cached_roles ?? []) : [];

        $query = $guild->exams();
        if (auth()->user()->cannot(PermissionEnum::MANAGE_EXAMS)) {
            $query->where('is_visible', true);
        }

        $exams = $query->with('questions')->get();

        return Inertia::render('exams/index', [
            'exams' => $exams,
            'user_roles' => $user_roles,
            'is_admin' => auth()->user()->can(PermissionEnum::MANAGE_EXAMS),
        ]);
    }

    /**
     * Show the form for creating a new exam.
     */
    public function create(): Response
    {
        if (auth()->user()->cannot(PermissionEnum::MANAGE_EXAMS)) {
            abort(403, __('app.error_no_permission'));
        }

        $guild = SelectedGuildService::get();
        $guild_roles = $guild->getData('roles', []);

        return Inertia::render('exams/create', [
            'guild_roles' => $guild_roles,
        ]);
    }

    /**
     * Store a newly created exam in storage.
     *
     * @return RedirectResponse
     */
    public function store(StoreExamRequest $request)
    {
        if (auth()->user()->cannot(PermissionEnum::MANAGE_EXAMS)) {
            abort(403, __('app.error_no_permission'));
        }

        $guild = SelectedGuildService::get();
        $data = $request->validated();

        try {
            DB::transaction(function () use ($guild, $data) {
                $questions_data = $data['questions'] ?? [];
                unset($data['questions']);

                $exam = $guild->exams()->create($data);

                foreach ($questions_data as $q_data) {
                    if (isset($q_data['time_limit']) && $q_data['time_limit'] !== null) {
                        $q_data['time_limit'] = (int) round($q_data['time_limit'] * 60);
                    }
                    $exam->questions()->create($q_data);
                }

                ActivityLog::make($guild->id, auth()->id(), null, ActionTypeEnum::CREATE_EXAM, $exam->toArray());
            });

            return redirect()->route('exams.index')->with('success', 'Vizsga sikeresen létrehozva.');
        } catch (Throwable $e) {
            return back()->with('error', $e->getMessage())->withInput();
        }
    }

    /**
     * Display the specified exam and its user attempts.
     */
    public function show(string|int $id): Response
    {
        if (auth()->user()->cannot(PermissionEnum::TAKE_EXAMS)) {
            abort(403, __('app.error_no_permission'));
        }

        $guild = SelectedGuildService::get();
        $exam = $guild->exams()->with(['questions', 'attempts' => function ($query) {
            $query->where('user_id', auth()->id())->latest();
        }])->findOrFail($id);

        $latest_attempt = $exam->attempts->first();
        if ($latest_attempt && $latest_attempt->status === 'started') {
            if ($exam->time_limit !== null) {
                $expiration = $latest_attempt->created_at->addMinutes($exam->time_limit);
                if (now()->greaterThanOrEqualTo($expiration)) {
                    $this->grading_service->evaluateAttempt($latest_attempt);
                    $exam->load(['attempts' => function ($query) {
                        $query->where('user_id', auth()->id())->latest();
                    }]);
                }
            }
        }

        $active_attempt = $exam->attempts->first();
        if ($active_attempt && $active_attempt->status !== 'started') {
            $active_attempt = null;
        }

        if ($exam->settings && ($exam->settings['shuffle_questions'] ?? false)) {
            $exam->setRelation('questions', $exam->questions->shuffle());
        }

        $guild_user = auth()->user()->guildUser($guild->id)->first();
        $user_roles = $guild_user ? ($guild_user->cached_roles ?? []) : [];

        if (auth()->user()->cannot(PermissionEnum::MANAGE_EXAMS) && ! empty($exam->required_roles)) {
            $has_role = false;
            foreach ($exam->required_roles as $role_id) {
                if (in_array($role_id, $user_roles)) {
                    $has_role = true;
                    break;
                }
            }
            if (! $has_role) {
                abort(403, 'Nincs jogosultságod ehhez a vizsgához.');
            }
        }

        return Inertia::render('exams/show', [
            'exam' => $exam,
            'is_admin' => auth()->user()->can(PermissionEnum::MANAGE_EXAMS),
            'active_attempt' => $active_attempt,
        ]);
    }

    /**
     * Show the form for editing the specified exam.
     */
    public function edit(int $id): Response
    {
        if (auth()->user()->cannot(PermissionEnum::MANAGE_EXAMS)) {
            abort(403, __('app.error_no_permission'));
        }

        $guild = SelectedGuildService::get();
        $exam = $guild->exams()->with('questions')->findOrFail($id);

        foreach ($exam->questions as $question) {
            if ($question->time_limit !== null) {
                $question->time_limit = $question->time_limit / 60;
            }
        }

        $guild_roles = $guild->getData('roles', []);

        return Inertia::render('exams/edit', [
            'exam' => $exam,
            'guild_roles' => $guild_roles,
        ]);
    }

    /**
     * Update the specified exam in storage.
     *
     * @return RedirectResponse
     */
    public function update(UpdateExamRequest $request, string|int $id)
    {
        if (auth()->user()->cannot(PermissionEnum::MANAGE_EXAMS)) {
            abort(403, __('app.error_no_permission'));
        }

        $guild = SelectedGuildService::get();
        $exam = $guild->exams()->findOrFail($id);
        $data = $request->validated();

        try {
            DB::transaction(function () use ($exam, $data, $guild) {
                $questions_data = $data['questions'] ?? [];
                unset($data['questions']);

                $exam->update($data);

                $exam->questions()->delete();
                foreach ($questions_data as $q_data) {
                    unset($q_data['id']);
                    if (isset($q_data['time_limit']) && $q_data['time_limit'] !== null) {
                        $q_data['time_limit'] = (int) round($q_data['time_limit'] * 60);
                    }
                    $exam->questions()->create($q_data);
                }

                ActivityLog::make($guild->id, auth()->id(), null, ActionTypeEnum::UPDATE_EXAM, $exam->toArray());
            });

            return redirect()->route('exams.index')->with('success', 'Vizsga sikeresen frissítve.');
        } catch (Throwable $e) {
            return back()->with('error', $e->getMessage())->withInput();
        }
    }

    /**
     * Remove the specified exam from storage.
     *
     * @return RedirectResponse
     */
    public function destroy(int $id)
    {
        if (auth()->user()->cannot(PermissionEnum::MANAGE_EXAMS)) {
            abort(403, __('app.error_no_permission'));
        }

        $guild = SelectedGuildService::get();
        $exam = $guild->exams()->findOrFail($id);

        try {
            DB::transaction(function () use ($exam, $guild) {
                $exam_data = $exam->toArray();
                $exam->delete();

                ActivityLog::make($guild->id, auth()->id(), null, ActionTypeEnum::DELETE_EXAM, $exam_data);
            });

            return redirect()->route('exams.index')->with('success', 'Vizsga sikeresen törölve.');
        } catch (Throwable $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    /**
     * Submit an attempt for the specified exam.
     */
    public function startAttempt(string|int $id): RedirectResponse
    {
        if (auth()->user()->cannot(PermissionEnum::TAKE_EXAMS)) {
            abort(403, __('app.error_no_permission'));
        }

        $guild = SelectedGuildService::get();
        $exam = $guild->exams()->findOrFail($id);

        $guild_user = auth()->user()->guildUser($guild->id)->first();
        if (! $guild_user) {
            abort(403, 'A felhasználó nem tagja ennek a guildnek.');
        }

        if (auth()->user()->cannot(PermissionEnum::MANAGE_EXAMS) && ! empty($exam->required_roles)) {
            $user_roles = $guild_user->cached_roles ?? [];
            $has_role = false;
            foreach ($exam->required_roles as $role_id) {
                if (in_array($role_id, $user_roles)) {
                    $has_role = true;
                    break;
                }
            }
            if (! $has_role) {
                abort(403, 'Nincs jogosultságod ehhez a vizsgához.');
            }
        }

        // Check if there is already an active started attempt
        $active_attempt = $exam->attempts()
            ->where('user_id', auth()->id())
            ->where('status', 'started')
            ->first();

        if ($active_attempt) {
            if ($exam->time_limit !== null) {
                $expiration = $active_attempt->created_at->addMinutes($exam->time_limit);
                if (now()->greaterThanOrEqualTo($expiration)) {
                    $this->grading_service->evaluateAttempt($active_attempt);
                    $active_attempt = null;
                }
            }
        }

        if (! $active_attempt) {
            $existing_attempts_count = $exam->attempts()
                ->where('user_id', auth()->id())
                ->count();

            if ($exam->max_attempts !== null && $existing_attempts_count >= $exam->max_attempts) {
                return back()->with('error', 'Elérted a maximális kitöltési korlátot.');
            }

            $active_attempt = $exam->attempts()->create([
                'guild_id' => $guild->id,
                'user_id' => auth()->id(),
                'guild_user_id' => $guild_user->id,
                'score' => null,
                'status' => 'started',
                'data' => [
                    'answers' => [],
                    'current_idx' => 0,
                    'current_question_started_at' => now()->toIso8601String(),
                ],
            ]);

            ActivityLog::make($guild->id, auth()->id(), null, ActionTypeEnum::CREATE_EXAM_ATTEMPT, $active_attempt->toArray());
        }

        return back()->with('success', 'Vizsga elindítva.');
    }

    public function saveAttempt(Request $request, string|int $id): JsonResponse
    {
        if (auth()->user()->cannot(PermissionEnum::TAKE_EXAMS)) {
            abort(403, __('app.error_no_permission'));
        }

        $guild = SelectedGuildService::get();
        $attempt = ExamAttempt::where('guild_id', $guild->id)
            ->where('user_id', auth()->id())
            ->findOrFail($id);

        if ($attempt->status !== 'started') {
            return response()->json(['error' => 'Attempt is not in started state.'], 400);
        }

        $validated = $request->validate([
            'answers' => ['nullable', 'array'],
            'current_idx' => ['nullable', 'integer'],
            'current_question_started_at' => ['nullable', 'string'],
        ]);

        $data = $attempt->data ?? [];
        if (isset($validated['answers'])) {
            $data['answers'] = $validated['answers'];
        }
        if (isset($validated['current_idx'])) {
            $data['current_idx'] = $validated['current_idx'];
        }
        if (isset($validated['current_question_started_at'])) {
            $data['current_question_started_at'] = $validated['current_question_started_at'];
        }

        $attempt->data = $data;
        $attempt->save();

        return response()->json(['success' => true]);
    }

    /**
     * Submit an attempt for the specified exam.
     *
     * @return RedirectResponse
     */
    public function submitAttempt(Request $request, string|int $id)
    {
        if (auth()->user()->cannot(PermissionEnum::TAKE_EXAMS)) {
            abort(403, __('app.error_no_permission'));
        }

        $guild = SelectedGuildService::get();
        $exam = $guild->exams()->findOrFail($id);

        $guild_user = auth()->user()->guildUser($guild->id)->first();
        if (! $guild_user) {
            abort(403, 'A felhasználó nem tagja ennek a guildnek.');
        }

        if (auth()->user()->cannot(PermissionEnum::MANAGE_EXAMS) && ! empty($exam->required_roles)) {
            $user_roles = $guild_user->cached_roles ?? [];
            $has_role = false;
            foreach ($exam->required_roles as $role_id) {
                if (in_array($role_id, $user_roles)) {
                    $has_role = true;
                    break;
                }
            }
            if (! $has_role) {
                abort(403, 'Nincs jogosultságod ehhez a vizsgához.');
            }
        }

        $attempt = $exam->attempts()
            ->where('user_id', auth()->id())
            ->where('status', 'started')
            ->latest()
            ->first();

        $request->validate([
            'answers' => ['required', 'array'],
        ]);

        try {
            if (! $attempt) {
                $existing_attempts_count = $exam->attempts()
                    ->where('user_id', auth()->id())
                    ->count();

                if ($exam->max_attempts !== null && $existing_attempts_count >= $exam->max_attempts) {
                    return back()->with('error', 'Elérted a maximális kitöltési korlátot.');
                }

                $attempt = DB::transaction(function () use ($exam, $guild, $guild_user, $request) {
                    $attempt = $exam->attempts()->create([
                        'guild_id' => $guild->id,
                        'user_id' => auth()->id(),
                        'guild_user_id' => $guild_user->id,
                        'score' => null,
                        'status' => 'pending',
                        'data' => [
                            'answers' => $request->input('answers'),
                        ],
                    ]);

                    ActivityLog::make($guild->id, auth()->id(), null, ActionTypeEnum::CREATE_EXAM_ATTEMPT, $attempt->toArray());

                    return $attempt;
                });
            } else {
                $attempt->update([
                    'data' => array_merge($attempt->data ?? [], [
                        'answers' => $request->input('answers'),
                    ]),
                ]);
            }

            $this->grading_service->evaluateAttempt($attempt);

            ActivityLog::make($guild->id, auth()->id(), null, ActionTypeEnum::GRADE_EXAM_ATTEMPT, $attempt->refresh()->toArray());

            return redirect()->route('exams.show', $exam->id)->with('success', 'Vizsga sikeresen beküldve és kiértékelve.');
        } catch (Throwable $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    /**
     * Display a listing of all exam attempts.
     */
    public function attempts(): Response
    {
        if (auth()->user()->cannot(PermissionEnum::MANAGE_EXAMS)) {
            abort(403, __('app.error_no_permission'));
        }

        $guild = SelectedGuildService::get();

        $attempts = ExamAttempt::where('guild_id', $guild->id)
            ->with(['exam', 'user', 'guildUser'])
            ->latest()
            ->get();

        return Inertia::render('exams/attempts/index', [
            'attempts' => $attempts,
        ]);
    }

    /**
     * Display the specified exam attempt.
     */
    public function showAttempt(string|int $id): Response
    {
        if (auth()->user()->cannot(PermissionEnum::MANAGE_EXAMS)) {
            abort(403, __('app.error_no_permission'));
        }

        $guild = SelectedGuildService::get();

        $attempt = ExamAttempt::where('guild_id', $guild->id)
            ->with(['exam.questions', 'user', 'guildUser'])
            ->findOrFail($id);

        $data = $attempt->data ?? [];
        $achievedPoints = $data['achieved_points'] ?? [];
        $submitted_answers = $data['answers'] ?? [];

        foreach ($attempt->exam->questions as $question) {
            $qId = (string) $question->id;
            if (! isset($achievedPoints[$qId])) {
                if ($question->type === 'free_text') {
                    $achievedPoints[$qId] = 0;
                } else {
                    $submitted_answer = $submitted_answers[$qId] ?? null;
                    if ($submitted_answer === null) {
                        $achievedPoints[$qId] = 0;
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
                            $correct_value = $content['correct'] ?? $content['correct_answer'] ?? null;
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

                    $achievedPoints[$qId] = $is_correct ? $question->points : 0;
                }
            }
        }

        $data['achieved_points'] = $achievedPoints;
        $attempt->data = $data;

        return Inertia::render('exams/attempts/show', [
            'attempt' => $attempt,
        ]);
    }

    /**
     * Grade the specified exam attempt.
     */
    public function gradeAttempt(Request $request, string|int $id): RedirectResponse
    {
        if (auth()->user()->cannot(PermissionEnum::MANAGE_EXAMS)) {
            abort(403, __('app.error_no_permission'));
        }

        $guild = SelectedGuildService::get();

        $attempt = ExamAttempt::where('guild_id', $guild->id)
            ->with(['exam', 'guildUser'])
            ->findOrFail($id);

        $validated = $request->validate([
            'score' => ['required', 'integer', 'between:0,100'],
            'status' => ['required', 'string', 'in:graded,pending,failed'],
            'achieved_points' => ['required', 'array'],
            'achieved_points.*' => ['required', 'numeric', 'min:0'],
        ]);

        try {
            DB::transaction(function () use ($attempt, $validated, $guild) {
                $data = $attempt->data ?? [];
                $data['achieved_points'] = $validated['achieved_points'];

                $attempt->update([
                    'score' => $validated['score'],
                    'status' => $validated['status'],
                    'data' => $data,
                ]);

                if ($attempt->status === 'graded' && $attempt->score >= $attempt->exam->min_percent) {
                    $this->assignPassedRoles($attempt);
                }

                ActivityLog::make($guild->id, auth()->id(), null, ActionTypeEnum::GRADE_EXAM_ATTEMPT, $attempt->toArray());
            });

            return redirect()->route('exams.attempts')->with('success', 'Vizsga sikeresen lejavítva.');
        } catch (Throwable $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    /**
     * Bulk delete exam attempts.
     */
    public function bulkDeleteAttempts(Request $request): RedirectResponse
    {
        if (auth()->user()->cannot(PermissionEnum::MANAGE_EXAMS)) {
            abort(403, __('app.error_no_permission'));
        }

        $validated = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer', 'exists:exam_attempts,id'],
        ]);

        DB::transaction(function () use ($validated) {
            ExamAttempt::whereIn('id', $validated['ids'])->delete();
        });

        return redirect()->back()->with('success', 'A kijelölt vizsga próbálkozások sikeresen törölve.');
    }

    /**
     * Bulk update exam attempts status.
     */
    public function bulkStatusAttempts(Request $request): RedirectResponse
    {
        if (auth()->user()->cannot(PermissionEnum::MANAGE_EXAMS)) {
            abort(403, __('app.error_no_permission'));
        }

        $validated = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer', 'exists:exam_attempts,id'],
            'status' => ['required', 'string', 'in:graded,pending,failed'],
        ]);

        DB::transaction(function () use ($validated) {
            $attempts = ExamAttempt::whereIn('id', $validated['ids'])
                ->with(['exam', 'guildUser'])
                ->get();

            foreach ($attempts as $attempt) {
                $attempt->update([
                    'status' => $validated['status']
                ]);

                if ($attempt->status === 'graded' && $attempt->score >= $attempt->exam->min_percent) {
                    $this->assignPassedRoles($attempt);
                }
            }
        });

        return redirect()->back()->with('success', 'A kijelölt vizsga próbálkozások státusza sikeresen frissítve.');
    }

    /**
     * Helper to assign passed roles to a member.
     */
    protected function assignPassedRoles(ExamAttempt $attempt): void
    {
        $exam = $attempt->exam;
        $guild_user = $attempt->guildUser;
        if (!$guild_user) {
            return;
        }
        $settings = $exam->settings ?? [];
        $roles = [];

        if (is_array($settings)) {
            if (isset($settings['passed_roles']) && is_array($settings['passed_roles'])) {
                $roles = $settings['passed_roles'];
            } elseif (isset($settings['roles']) && is_array($settings['roles'])) {
                $roles = $settings['roles'];
            } elseif (isset($settings['roles_to_assign']) && is_array($settings['roles_to_assign'])) {
                $roles = $settings['roles_to_assign'];
            } else {
                $is_list = count(array_filter(array_keys($settings), 'is_string')) === 0;
                if ($is_list) {
                    $roles = $settings;
                }
            }
        }

        foreach ($roles as $role_id) {
            if (is_string($role_id)) {
                DiscordFetchService::addRoleToMember($attempt->guild_id, $attempt->user_id, $role_id);

                $cached_roles = $guild_user->cached_roles ?? [];
                if (!in_array($role_id, $cached_roles)) {
                    $cached_roles[] = $role_id;
                    $guild_user->cached_roles = $cached_roles;
                    $guild_user->save();
                }
            }
        }
    }
}
