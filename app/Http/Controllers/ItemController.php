<?php

namespace App\Http\Controllers;

use App\Enums\ActionTypeEnum;
use App\Enums\ItemTypeEnum;
use App\Enums\PermissionEnum;
use App\Http\Requests\IndexItemRequest;
use App\Http\Requests\StoreItemRequest;
use App\Http\Requests\UpdateItemRequest;
use App\Models\ActivityLog;
use App\Models\Item;
use App\Services\ItemService;
use App\Services\SelectedGuildService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class ItemController extends Controller
{
    public function __construct(private readonly ItemService $service) {}

    public function index(IndexItemRequest $request): Response
    {
        $guild = SelectedGuildService::get();

        $type = ItemTypeEnum::from($request->validated()['type']);

        $this->authorizeItemAction(PermissionEnum::VIEW_ITEMS, $type);

        $items = $guild->items()->with('image')->where('type', $type)->orderBy('position')->get();

        return Inertia::render('items/index', [
            'items' => $items,
            'type' => $type,
        ]);
    }

    public function store(StoreItemRequest $request): RedirectResponse
    {
        $guild = SelectedGuildService::get();
        $data = $request->validated();

        $this->authorizeItemAction(PermissionEnum::ADD_ITEMS, ItemTypeEnum::from($data['type']));

        try {
            $item = DB::transaction(function () use ($request, $data, $guild) {
                $item = $this->service->createItem($guild, $data, $request->file('image'));

                ActivityLog::make($guild->id, auth()->id(), null, ActionTypeEnum::ADD_ITEM_TO_GUILD, $data);

                return $item;
            });

            return back()->with('success', 'Sikeresen létrehoztad a(z) '.$item->name.'.');
        } catch (Throwable $e) {
            Log::error($e);

            return back()->with('error', __('app.error_action'))->withInput();
        }
    }

    public function update(UpdateItemRequest $request, Item $item): RedirectResponse
    {
        $data = $request->validated();
        $new_type = ItemTypeEnum::from($data['type']);

        $this->authorizeItemAction(PermissionEnum::EDIT_ITEMS, $item->type);

        if ($new_type !== $item->type) {
            $this->authorizeItemAction(PermissionEnum::EDIT_ITEMS, $new_type);
        }

        try {
            DB::transaction(fn () => $this->service->updateItem($item, $data, $request->file('image')));

            return back()->with('success', 'Sikeresen módosítottad a(z) '.$item->name.'.');
        } catch (Throwable $e) {
            Log::error($e);

            return back()->with('error', __('app.error_action'))->withInput();
        }
    }

    public function destroyImage(Item $item): RedirectResponse
    {
        $this->authorizeItemAction(PermissionEnum::EDIT_ITEMS, $item->type);

        $this->service->deleteImage($item);

        return back()->with('success', 'A kép törölve lett.');
    }

    public function delete(Item $item): RedirectResponse
    {
        $this->authorizeItemAction(PermissionEnum::DELETE_ITEMS, $item->type);

        try {
            $item_data = $item->toArray();
            $item->delete();
            ActivityLog::make($item->guild_id, auth()->id(), null, ActionTypeEnum::DELETE_ITEM_FROM_GUILD, $item_data);

            return back()->with('success', 'Sikeresen törölve a(z) '.$item->name.'.');
        } catch (Throwable $e) {
            Log::error($e);

            return back()->with('error', __('app.error_action'));
        }
    }

    /**
     * Allows the action with either the general item permission or the type specific one.
     */
    private function authorizeItemAction(PermissionEnum $general_permission, ItemTypeEnum $type): void
    {
        $user = auth()->user();

        if ($user->can($general_permission)) {
            return;
        }

        $type_permission = match ($general_permission) {
            PermissionEnum::VIEW_ITEMS => $type === ItemTypeEnum::VEHICLE ? PermissionEnum::VIEW_ITEM_VEHICLES : PermissionEnum::VIEW_ITEM_CLOTHES,
            PermissionEnum::ADD_ITEMS => $type === ItemTypeEnum::VEHICLE ? PermissionEnum::ADD_ITEM_VEHICLES : PermissionEnum::ADD_ITEM_CLOTHES,
            PermissionEnum::EDIT_ITEMS => $type === ItemTypeEnum::VEHICLE ? PermissionEnum::EDIT_ITEM_VEHICLES : PermissionEnum::EDIT_ITEM_CLOTHES,
            PermissionEnum::DELETE_ITEMS => $type === ItemTypeEnum::VEHICLE ? PermissionEnum::DELETE_ITEM_VEHICLES : PermissionEnum::DELETE_ITEM_CLOTHES,
        };

        if ($user->cannot($type_permission)) {
            abort(403, __('app.error_no_permission'));
        }
    }
}
