<?php

namespace App\Http\Controllers;

use App\Enums\DutyStatusEnum;
use App\Http\Requests\BulkDeleteDutyRequest;
use App\Http\Requests\IndexDutyRequest;
use App\Http\Requests\StoreDutyRequest;
use App\Http\Requests\UpdateDutyRequest;
use App\Http\Requests\UpdateStatusDutyRequest;
use App\Models\Duty;
use App\Services\DutyService;
use App\Services\SelectedGuildService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class DutyController extends Controller
{
    public function __construct(private readonly DutyService $service) {}

    public function index(IndexDutyRequest $request): Response
    {
        $guild = SelectedGuildService::get();
        $filters = $request->validated();

        $duties = $this->service->getPaginatedDuties($guild, $filters);

        $guild_users = $guild->acceptedGuildUsers()
            ->with('user:id,name')
            ->get()
            ->map(function ($gu) {
                return [
                    'id' => $gu->id,
                    'label' => ($gu->ic_name ? $gu->ic_name.' - ' : '').$gu->user->name,
                    'full_user' => $gu,
                ];
            })->values()->toArray();

        return Inertia::render('duties/index', [
            'duties' => $duties,
            'filters' => empty($filters) ? (object) [] : $filters,
            'guild_users' => $guild_users,
        ]);
    }

    public function active(IndexDutyRequest $request): Response
    {
        $guild = SelectedGuildService::get();
        $filters = $request->validated();

        $query = Duty::query()
            ->select('duties.*')
            ->join('guild_users', 'duties.guild_user_id', '=', 'guild_users.id')
            ->join('users', 'guild_users.user_id', '=', 'users.id')
            ->where('guild_users.guild_id', $guild->id)
            ->whereNull('duties.finished_at')
            ->with(['guildUser.user:id,name']);

        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('users.name', 'like', "%{$search}%")
                    ->orWhere('guild_users.user_id', 'like', "%{$search}%")
                    ->orWhere('guild_users.ic_name', 'like', "%{$search}%");
            });
        }

        $sort = $filters['sort'] ?? 'started_at';
        $direction = strtolower($filters['direction'] ?? 'desc') === 'asc' ? 'asc' : 'desc';

        switch ($sort) {
            case 'discord_id':
                $query->orderBy('guild_users.user_id', $direction);
                break;
            case 'discord_name':
                $query->orderBy('users.name', $direction);
                break;
            case 'ic_name':
                $query->orderBy('guild_users.ic_name', $direction);
                break;
            default:
                $query->orderBy('duties.started_at', $direction);
                break;
        }

        $active_duties = $query->paginate($filters['per_page'] ?? 15)->withQueryString();

        $chart_data_array = [];
        for ($i = 23; $i >= 0; $i--) {
            $hourString = now()->subHours($i)->format('H:00');
            $chart_data_array[$hourString] = [
                'date' => $hourString,
                'count' => 0,
            ];
        }

        // 2. Adatbázis lekérdezés
        $db_data = DB::table('duties')
            ->join('guild_users', 'duties.guild_user_id', '=', 'guild_users.id')
            ->where('guild_users.guild_id', $guild->id)
            ->where('duties.started_at', '>=', now()->subHours(24))
            ->selectRaw('DATE_FORMAT(duties.started_at, "%H:00") as date, COUNT(*) as count')
            ->groupBy('date')
            ->get();

        // 3. Adatok rátöltése a tömbre
        foreach ($db_data as $row) {
            // Ellenőrizzük, hogy az óra létezik-e az alap tömbben
            if (isset($chart_data_array[$row->date])) {
                $chart_data_array[$row->date]['count'] = (int) $row->count;
            }
        }

        // 4. Az asszociatív tömb kulcsait eldobjuk (hogy egy sima JSON listát kapjon a React)
        $chart_data = array_values($chart_data_array);

        return Inertia::render('duties/active', [
            'active_duties' => $active_duties,
            'current_active_count' => $active_duties->total(),
            'chart_data' => $chart_data,
            'filters' => empty($filters) ? (object) [] : $filters,
        ]);
    }

    public function store(StoreDutyRequest $request): RedirectResponse
    {
        $data = $request->validated();
        try {
            $this->service->storeDuty($data);

            return back()->with('success', 'Szolgálati idő sikeresen hozzáadva.')->withInput();
        } catch (Throwable $e) {
            Log::error($e->getMessage());

            return back()->withErrors(['form_error' => $e->getMessage()])->withInput();
        }
    }

    public function update(Duty $duty, UpdateDutyRequest $request): RedirectResponse
    {
        $data = $request->validated();
        try {
            $duty->update($data);

            return back()->with('success', 'Szolgáltatási idő sikeresen módosítve.')->withInput();
        } catch (Throwable $e) {
            Log::error($e->getMessage());

            return back()->withErrors(['form_error' => $e->getMessage()])->withInput();
        }
    }

    public function updateStatuses(UpdateStatusDutyRequest $request): RedirectResponse
    {
        $data = $request->validated();
        try {
            $status_enum = DutyStatusEnum::from($data['status']);
            $this->service->updateDutiesStatus($data['duty_ids'], $status_enum);

            return back()->with('success', 'Sikeresen módosítva a szogálati idő(k) státusza.');
        } catch (Throwable $e) {
            Log::error($e->getMessage());

            return back()->withErrors(['form_error' => $e->getMessage()])->withInput();
        }

    }

    public function delete(Duty $duty)
    {
        try {
            $this->service->deleteDuty($duty);

            return back()->with('success', 'Szolgálati idő sikeresen törölve.');
        } catch (Throwable $e) {
            Log::error($e->getMessage());

            return back()->withErrors(['form_error' => $e->getMessage()])->withInput();
        }
    }

    public function bulkDelete(BulkDeleteDutyRequest $request)
    {
        $data = $request->validated();
        $status = isset($data['status']) ? DutyStatusEnum::from((int) $data['status']) : DutyStatusEnum::ALL_PERIOD;

        try {
            $this->service->deleteDuties($data['duty_ids'], $status);

            return back()->with('succes', 'Szolgálati idők sikeresen törölve.');
        } catch (Throwable $e) {
            Log::error($e->getMessage());

            return back()->withErrors(['form_error' => $e->getMessage()])->withInput();
        }
    }
}
