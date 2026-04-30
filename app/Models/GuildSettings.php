<?php

namespace App\Models;

use App\Enums\FeatureEnum;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['guild_id', 'features', 'feature_settings', 'user_details_config', 'current_view', 'is_complete'])]
class GuildSettings extends Model
{
    protected $table = 'guild_settings';

    protected $primaryKey = 'guild_id';

    protected $keyType = 'string';

    public $incrementing = false;

    /**
     * @return string[]
     */
    protected function casts(): array
    {
        return [
            'features' => 'array',
            'feature_settings' => 'array',
            'user_details_config' => 'array',
            'current_view' => 'string',
            'is_complete' => 'bool',
        ];
    }

    public function guild(): BelongsTo
    {
        return $this->belongsTo(Guild::class, 'guild_id', 'guild_id');
    }

    public function isEnabledFeature(FeatureEnum $feature): bool
    {
        return in_array($feature->value, $this->features);
    }

    public function getFeatureSettings(FeatureEnum $feature, $settings_name = null): string|int|float|array|null
    {
        if (isset($this->feature_settings[$feature->value])) {
            if (is_null($settings_name)) {
                return $this->feature_settings[$feature->value];
            } else {
                return $this->feature_settings[$feature->value][$settings_name];
            }
        }

        return null;
    }

    public function setFeatureSettings(FeatureEnum $feature, ?string $settings_name, mixed $settings_value): void
    {
        if (is_null($settings_name)) {
            $this->feature_settings[$feature->value] = $settings_value;
        } else {
            $this->feature_settings[$feature->value][$settings_name] = $settings_value;
        }
    }
}
