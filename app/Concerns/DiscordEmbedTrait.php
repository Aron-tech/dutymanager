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

    protected function chunkTextLines(array $lines, int $max_length = 3200): array
    {
        $chunks = [];
        $current_chunk = '';

        foreach ($lines as $line) {
            if (strlen($current_chunk) + strlen($line) > $max_length) {
                $chunks[] = trim($current_chunk);
                $current_chunk = '';
            }
            $current_chunk .= $line."\n";
        }

        if (! empty($current_chunk)) {
            $chunks[] = trim($current_chunk);
        }

        return $chunks;
    }
}
