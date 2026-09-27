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
        $item = $guild->items()->create([
            'guild_id' => $guild->id,
            'name' => $data['name'],
            'type' => $data['type'],
            'details' => $this->buildDetails($data),
            'position' => Item::where('guild_id', $guild->id)->max('position') + 1,
        ]);

        if ($image) {
            $this->replaceImage($item, $image);
        }

        return $item;
    }

    public function updateItem(Item $item, array $data, ?UploadedFile $image): Item
    {
        $item->update([
            'name' => $data['name'],
            'type' => $data['type'],
            'details' => $this->buildDetails($data),
        ]);

        if ($image) {
            $this->replaceImage($item, $image);
        }

        return $item;
    }

    public function deleteImage(Item $item): void
    {
        $item->image?->delete();
        $item->unsetRelation('image');
    }

    private function replaceImage(Item $item, UploadedFile $image): void
    {
        $path = self::storeFile($image, "guilds/{$item->guild_id}/{$item->type->value}");

        if (! $path) {
            return;
        }

        $this->deleteImage($item);

        $item->image()->create([
            'path' => $path,
            'disk' => 'public',
        ]);
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function buildDetails(array $data): array
    {
        $details = [];

        if (! empty($data['roles'])) {
            $details['roles'] = array_values(array_filter(array_map('trim', explode(',', $data['roles']))));
        }

        if ($data['type'] === ItemTypeEnum::VEHICLE->value) {
            $details['spawn_code'] = $data['spawn_code'] ?? null;
            $details['max_speed'] = $data['max_speed'] ?? null;

            return $details;
        }

        $details['season'] = $data['season'] ?? null;

        $clothing_fields = [
            'mask', 'jackets', 'body_armor', 'hands', 'decals', 'hats', 'ears',
            'scarves_chains', 'shirts', 'bags', 'pants', 'shoes', 'glasses', 'watches',
        ];

        foreach ($clothing_fields as $field) {
            if (! empty($data[$field])) {
                $details[$field] = $data[$field];
            }
        }

        return $details;
    }
}
