<?php

namespace App\Services;

use App\Concerns\FileHandlerTrait;
use App\Enums\ItemTypeEnum;
use App\Models\Guild;
use App\Models\Item;
use Illuminate\Http\UploadedFile;

class ItemService
{
    use FileHandlerTrait;

    public function createItem(Guild $guild, array $data, ?UploadedFile $image): Item
    {
        $details = [];

        $type = ItemTypeEnum::from($data['type']);

        if (! empty($data['roles'])) {
            $details['roles'] = array_filter(array_map('trim', explode(',', $data['roles'])));
        }

        if (! empty($image)) {
            $path = self::storeFile($image, "guilds/{$guild->id}/{$type->value}");
        }

        if ($data['type'] === ItemTypeEnum::VEHICLE->value) {
            $details['spawn_code'] = $data['spawn_code'] ?? null;
            $details['max_speed'] = $data['max_speed'] ?? null;
        } else {
            $details['season'] = $data['season'] ?? null;

            $clothingFields = [
                'mask', 'jackets', 'body_armor', 'hands', 'decals', 'hats', 'ears',
                'scarves_chains', 'shirts', 'bags', 'pants', 'shoes', 'glasses', 'watches',
            ];

            foreach ($clothingFields as $field) {
                if (! empty($data[$field])) {
                    $details[$field] = $data[$field];
                }
            }
        }

        $item = $guild->items()->create([
            'name' => $data['name'],
            'type' => $data['type'],
            'details' => $details,
            'position' => Item::where('guild_id', $guild->id)->max('position') + 1,
        ]);

        if ($image && $path) {
            $item->image()->create([
                'path' => $path,
                'disk' => 'public',
            ]);
        }

        return $item;
    }
}
