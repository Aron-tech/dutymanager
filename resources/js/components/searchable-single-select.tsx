import React, { useState, useMemo } from 'react';
import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
} from '@/components/ui/combobox';

export interface SelectItem {
    value: string;
    label: string;
}

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
        [items, value]
    );

    const handleValueChange = (label: string) => {
        const found = items.find((i) => i.label === label);

        if (found) {
            onChange(found.value);
            setSearchQuery('');
        }
    };

    return (
        <Combobox
            items={items.map((i) => i.label)}
            value={selected_item?.label || ''}
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

            <ComboboxContent>
                <ComboboxEmpty>Nincs találat.</ComboboxEmpty>
                <ComboboxList>
                    {(label: string) => {
                        const item = items.find((i) => i.label === label);

                        if (!item) {
                            return null;
                        }

                        return (
                            <ComboboxItem key={item.value} value={item.label}>
                                {renderItem(item)}
                            </ComboboxItem>
                        );
                    }}
                </ComboboxList>
            </ComboboxContent>
        </Combobox>
    );
}
