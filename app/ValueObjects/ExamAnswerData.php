<?php

namespace App\ValueObjects;

/**
 * Immutable Value Object a vizsgaválaszok kezelésére.
 */
readonly class ExamAnswerData
{
    /**
     * @param  array<string, mixed>  $values
     */
    public function __construct(
        private array $values
    ) {}

    /**
     * Statikus gyári metódus tömbből való példányosításhoz
     */
    public static function fromArray(array $data): self
    {
        return new self($data);
    }

    /**
     * Visszaadja a kiválasztott ID-kat (pl. feleletválasztós kérdésnél)
     *
     * * @return array<int>
     */
    public function getSelectedIds(): array
    {
        return array_map('intval', $this->values['selected_ids'] ?? []);
    }

    /**
     * Visszaadja a beírt szöveget (pl. kifejtős kérdésnél)
     */
    public function getText(): string
    {
        return trim((string) ($this->values['text'] ?? ''));
    }

    /**
     * Visszaadja a párosításokat (pl. párosítós kérdésnél)
     */
    public function getPairs(): array
    {
        return (array) ($this->values['pairs'] ?? []);
    }

    /**
     * Visszaadja a nyers adatokat tömbként a mentéshez
     */
    public function toArray(): array
    {
        return $this->values;
    }
}
