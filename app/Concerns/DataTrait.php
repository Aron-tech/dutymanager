<?php

namespace App\Concerns;

use App\Models\Guild;
use App\Models\GuildUser;
use App\Models\Item;
use App\Services\DutyMonitorService;
use Illuminate\Support\Arr;

trait DataTrait
{
    /**
     * @return string
     */
    protected function getJsonColumnName(): string
    {
        return property_exists($this, 'json_data_column') ? $this->json_data_column : 'data';
    }

    /**
     * @param string $json_key
     * @param mixed $value
     * @return Item|DataTrait|Guild|GuildUser|DutyMonitorService
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
     * @param string $json_key
     * @param mixed|null $default_value
     * @return mixed
     */
    public function getData(string $json_key, mixed $default_value = null): mixed
    {
        $column_name = $this->getJsonColumnName();
        $current_data = $this->getAttribute($column_name) ?? [];

        if (is_string($current_data)) {
            $current_data = json_decode($current_data, true) ?: [];
        }

        return Arr::get($current_data, $json_key, $default_value);
    }

    /**
     * @param string $json_key
     * @return bool
     */
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
