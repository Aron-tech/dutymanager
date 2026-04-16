import React, { useState, useMemo } from 'react';
import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
} from '@/components/ui/combobox';
import type { SelectItem } from '@/types';

interface SearchableSingleSelectProps {
    items: SelectItem[];
    value: string | undefined | null;
    onChange: (value: string) => void;
    placeholder?: string;
    renderItem: (item: SelectItem) => React.ReactNode;
}

export default function SearchableSingleSelect({
    items,
    value,
    onChange,
    placeholder = 'Keresés...',
    renderItem,
}: SearchableSingleSelectProps) {
    const [search_query, setSearchQuery] = useState('');

    const selected_item = useMemo(
        () => items.find((i) => i.value === value),
        [items, value],
    );

    const SEPARATOR = ':::';
    const getUniqueString = (item: SelectItem) =>
        `${item.label}${SEPARATOR}${item.value}`;

    const handleValueChange = (uniqueStr: string | null | undefined) => {
        if (!uniqueStr) {
            onChange(''); // Visszaállítjuk a kiválasztott értéket üresre
            setSearchQuery('');

            return;
        }

        const parts = uniqueStr.split(SEPARATOR);
        const val = parts[parts.length - 1];
        const found = items.find((i) => i.value === val);

        if (found) {
            onChange(found.value);
            setSearchQuery('');
        }
    };

    const displayValue = selected_item ? getUniqueString(selected_item) : '';

    return (
        <Combobox
            items={items.map(getUniqueString)}
            value={displayValue}
            onValueChange={handleValueChange}
        >
            <div className="relative w-full">
                <ComboboxInput
                    placeholder={value ? '' : placeholder}
                    className="relative z-0 w-full"
                    value={search_query}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />

                {selected_item && !search_query && (
                    <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm">
                        {renderItem(selected_item)}
                    </div>
                )}
            </div>

            <ComboboxContent
                onPointerDown={(e) => e.stopPropagation()}
                onWheel={(e) => e.stopPropagation()}
            >
                <ComboboxEmpty>Nincs találat.</ComboboxEmpty>
                <ComboboxList className="pointer-events-auto max-h-[250px] overflow-y-auto">
                    {(uniqueStr: string) => {
                        if (!uniqueStr) {
                            return null;
                        }

                        const parts = uniqueStr.split(SEPARATOR);
                        const val = parts[parts.length - 1];
                        const item = items.find((i) => i.value === val);

                        if (!item) {
                            return null;
                        }

                        return (
                            <ComboboxItem key={item.value} value={uniqueStr}>
                                {renderItem(item)}
                            </ComboboxItem>
                        );
                    }}
                </ComboboxList>
            </ComboboxContent>
        </Combobox>
    );
}
