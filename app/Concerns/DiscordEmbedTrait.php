<?php

namespace App\Concerns;

trait DiscordEmbedTrait
{
    private function buildEmbedData(string $title, string $color = '0000FF', string $description = '', array $fields = []): array
    {
        return [
            'title' => $title,
            'color' => $color,
            'description' => $description,
            'fields' => $fields,
        ];
    }

    protected function makeEmbedField(string $name, string $value, bool $inline = true, bool $codeBlock = false): array
    {
        return [
            'name' => $name,
            'value' => $value,
            'inline' => $inline,
            'codeBlock' => $codeBlock,
        ];
    }
}
