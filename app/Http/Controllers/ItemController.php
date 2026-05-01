<?php

namespace App\Http\Controllers;

use App\Enums\ItemTypeEnum;
use App\Enums\PermissionEnum;
use App\Http\Requests\IndexItemRequest;
use App\Http\Requests\StoreItemRequest;
use App\Models\Item;
use App\Services\ItemService;
use App\Services\SelectedGuildService;
use Illuminate\Http\Request;
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
        $type = ItemTypeEnum::from($request->validated()['type']);

        if (auth()->user()->cannot(PermissionEnum::VIEW_ITEMS)) {
            if (($type === ItemTypeEnum::VEHICLE && auth()->user()->cannot(PermissionEnum::VIEW_ITEM_VEHICLES)) || ($type === ItemTypeEnum::CLOTHING && auth()->user()->cannot(PermissionEnum::VIEW_ITEM_CLOTHES))) {
                abort(403, __('app.error_no_permission'));
            }
        }

        $items = Item::with('image')->where('type', $type)->orderBy('position')->get();

        return Inertia::render('items/index', [
            'items' => $items,
            'type' => $type,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreItemRequest $request)
    {
        $guild = SelectedGuildService::get();
        $data = $request->validated();
        try {
            $item = DB::transaction(function () use ($request, $data, $guild) {
                $item = $this->service->createItem($guild, $data, $request->file('image'));

                return $item;
            });

            return back()->with('success', 'Sikeresen létrehoztad a(z) '.$item->name.'.');
        } catch (Throwable $e) {
            return back()->with('error', $e->getMessage())->withInput();
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Item $item)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Item $item)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Item $item)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function delete(Item $item)
    {
        try {
            $item_model = $item;
            $item->delete();

            return back()->with('success', 'Sikeresen törölve a(z) '.$item_model?->name.'.');
        } catch (Throwable $e) {
            Log::error($e);

            return back()->with('error', $e->getMessage())->withInput();
        }
    }
}
