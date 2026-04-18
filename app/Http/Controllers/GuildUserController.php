<?php

namespace App\Http\Controllers;

use App\Enums\DutyActionEnum;
use App\Enums\DutyStatusEnum;
use App\Enums\PunishmentTypeEnum;
use App\Http\Requests\BulkDeleteGuildUserRequest;
use App\Http\Requests\IndexGuildUserRequest;
use App\Http\Requests\StoreGuildUserRequest;
use App\Http\Requests\UpdateGuildUserRequest;
use App\Http\Requests\UploadImageRequest;
use App\Models\GuildUser;
use App\Models\Image;
use App\Services\GuildUserService;
use App\Services\SelectedGuildService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Throwable;

class GuildUserController extends Controller
{
    public function __construct(private readonly GuildUserService $service) {}

    public function index(IndexGuildUserRequest $request): Response
    {
        $guild = SelectedGuildService::get();
        $validated = $request->validated();

        return Inertia::render('guild-users/index', $this->service->getIndexData($guild, $validated));
    }

    public function store(StoreGuildUserRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $guild = SelectedGuildService::get();
        $data['guild_id'] = $guild->id;

        try {
            $this->service->joinUserToGuild($data);

            return back()->with('success', 'Felhasználó sikeresen hozzáadva!');
        } catch (ValidationException $e) {
            return back()->withErrors($e->errors())->withInput();
        } catch (Throwable $e) {
            return back()->withErrors(['form_error' => $e->getMessage()])->withInput();
        }
    }

    public function update(GuildUser $guild_user, UpdateGuildUserRequest $request): RedirectResponse
    {
        $data = $request->validated();
        try {
            $this->service->updateGuildUser($guild_user, $data);

            return back()->with('success', 'Felhasználó adatai sikeresen módosítva')->withInput();
        } catch (Throwable $e) {
            Log::error($e->getMessage());

            return back()->withErrors(['form_error' => $e->getMessage()])->withInput();
        }
    }

    public function delete(GuildUser $guild_user): RedirectResponse
    {
        $guild = SelectedGuildService::get();

        try {
            $this->service->deleteUsersFromGuild($guild, [$guild_user->id]);

            return back()->with('success', 'A felhasználó törölve lett.');
        } catch (Throwable $e) {
            Log::error($e);

            return back()->withErrors(['error' => 'Hiba történt a törlés során!']);
        }
    }

    public function bulkDelete(BulkDeleteGuildUserRequest $request): RedirectResponse
    {
        $guild = SelectedGuildService::get();
        $validated = $request->validated();

        try {
            $this->service->deleteUsersFromGuild($guild, $validated['ids']);

            return back()->with('success', 'A kijelölt felhasználók törölve lettek.');
        } catch (Throwable $e) {
            Log::error($e);

            return back()->withErrors(['error' => 'Hiba történt a törlés során!']);
        }
    }

    public function getDutiesData(GuildUser $guild_user): JsonResponse
    {
        $guild_user->load(['user', 'duties']);

        $total_current_duties = $guild_user->getDutiesValue();
        $total_duties = $guild_user->getDutiesValue(DutyStatusEnum::ALL_PERIOD);

        return response()->json([$guild_user, $total_current_duties, $total_duties]);
    }

    public function getPunishmentsData(GuildUser $guild_user): JsonResponse
    {
        $guild_user->load(['punishments.createdByUser:id,name']);

        return response()->json([
            'punishments' => $guild_user->punishments,
            'types' => PunishmentTypeEnum::getTranslatedOptions(),
        ]);
    }

    public function getImagesData(GuildUser $guild_user): JsonResponse
    {
        $guild_user->load(['user', 'images']);

        return response()->json($guild_user);
    }

    public function showImage(Image $image): StreamedResponse
    {
        if (! Storage::disk($image->disk)->exists($image->path)) {
            abort(404);
        }

        if (ob_get_level()) {
            ob_end_clean();
        }

        return Storage::disk($image->disk)->response($image->path);
    }

    public function storeImage(UploadImageRequest $request, GuildUser $guild_user): RedirectResponse
    {
        $request->validated();

        try {
            $this->service->addImageToUser($guild_user, $request->file('image'));

            return back()->with('success', 'Kép sikeresen feltöltve!');
        } catch (Throwable $e) {
            Log::error($e->getMessage());

            return back()->withErrors(['error' => 'Sikertelen feltöltés.']);
        }
    }

    public function deleteImage(Image $image): RedirectResponse
    {
        try {
            $this->service->removeImage($image);

            return back()->with('success', 'Kép törölve.');
        } catch (Throwable $e) {
            return back()->withErrors(['error' => 'Hiba a törlés során.']);
        }
    }

    public function toggleDuty(GuildUser $guild_user): JsonResponse
    {
        $message = null;

        try {
            $result = DB::transaction(function () use ($guild_user, &$message) {
                return $guild_user->duty();
            });

            if (! empty($result['action'])) {
                if ($result['duty_action'] == DutyActionEnum::ON_DUTY) {
                    $message = __('duty.success_duty_on');
                } elseif ($result['duty_action'] == DutyActionEnum::OFF_DUTY) {
                    $message = __('duty.success_duty_off');
                }
            }

            return response()->json(['success' => true, 'message' => $message, 'result' => $result]);
        } catch (Throwable $e) {
            Log::error($e);

            return response()->json(['success' => false, 'message' => __('app.error_action')]);
        }
    }
}
