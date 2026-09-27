<?php

namespace App\Concerns;

use App\Models\Guild;
use App\Models\GuildUser;
use App\Models\Item;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

trait DataTrait
{
    protected function getJsonColumnName(): string
    {
        return property_exists($this, 'json_data_column') ? $this->json_data_column : 'data';
    }

    /**
     * @return Item|DataTrait|Guild|GuildUser
     */
    public function setData(string $json_key, mixed $value): self
    {
        $column_name = $this->getJsonColumnName();
        $current_data = $this->getAttribute($column_name) ?? [];

        if (is_string($current_data)) {
            $current_data = json_decode($current_data, true) ?: [];
        }

        Arr::set($current_data, $json_key, $value);

        $this->setAttribute($column_name, $current_data);

        return $this;
    }

    /**
     * Sets a single JSON key and persists it based on the freshest database row,
     * so concurrent writers (e.g. async Discord callbacks) never overwrite each other's keys.
     */
    public function saveDataAtomically(string $json_key, mixed $value): self
    {
        $column_name = $this->getJsonColumnName();

        DB::transaction(function () use ($json_key, $value, $column_name) {
            $fresh_model = static::query()->whereKey($this->getKey())->lockForUpdate()->first();

            if (! $fresh_model) {
                Log::warning('saveDataAtomically: a rekord már nem található, az írás elveszett.', [
                    'model' => static::class,
                    'id' => $this->getKey(),
                    'json_key' => $json_key,
                ]);

                return;
            }

            $fresh_model->setData($json_key, $value)->save();

            $this->setAttribute($column_name, $fresh_model->getAttribute($column_name));
            $this->syncOriginalAttribute($column_name);
        });

        return $this;
    }

    public function getData(string $json_key, mixed $default_value = null): mixed
    {
        $column_name = $this->getJsonColumnName();
        $current_data = $this->getAttribute($column_name) ?? [];

        if (is_string($current_data)) {
            $current_data = json_decode($current_data, true) ?: [];
        }

        return Arr::get($current_data, $json_key, $default_value);
    }

    public function hasData(string $json_key): bool
    {
        $column_name = $this->getJsonColumnName();
        $current_data = $this->getAttribute($column_name) ?? [];

        if (is_string($current_data)) {
            $current_data = json_decode($current_data, true) ?: [];
        }

        return Arr::has($current_data, $json_key);
    }
}
