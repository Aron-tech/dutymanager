import { Check, ChevronsUpDown } from 'lucide-react';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { SelectItem } from '@/types';

interface SearchableSingleSelectProps {
    items?: SelectItem[] | null;
    value: string | undefined | null;
    onChange: (value: string) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyPlaceholder?: string;
    className?: string;
    renderItem?: (item: SelectItem) => React.ReactNode;
}

export default function SearchableSingleSelect({
    items = [],
    value,
    onChange,
    placeholder = 'Válassz...',
    searchPlaceholder = 'Keresés...',
    emptyPlaceholder = 'Nincs találat.',
    className,
    renderItem,
}: SearchableSingleSelectProps) {
    const [open, setOpen] = React.useState(false);

    // BIZTOSÍTÉK: Ha null, undefined vagy asszociatív objektum jön a PHP/Laravel oldalról
    const safeItems = React.useMemo(() => {
        if (!items) {
            return [];
        }

        if (Array.isArray(items)) {
            return items;
        }

        // Ha a Laravel associatív tömbként küldte át (pl. ['id1' => [...], 'id2' => [...]])
        if (typeof items === 'object') {
            return Object.values(items);
        }

        return [];
    }, [items]);

    const selectedItem = safeItems.find((item) => item && item.value === value);

    const defaultRenderItem = (item: SelectItem) => item?.label || '';

    const displayRender = renderItem || defaultRenderItem;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn('w-full justify-between', className)}
                >
                    {selectedItem ? (
                        <div className="flex items-center">
                            {displayRender(selectedItem)}
                        </div>
                    ) : (
                        placeholder
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                    <CommandInput placeholder={searchPlaceholder} />
                    <CommandList>
                        <CommandEmpty>{emptyPlaceholder}</CommandEmpty>
                        <CommandGroup>
                            {safeItems.map((item) => {
                                if (!item || !item.value) return null;

                                return (
                                    <CommandItem
                                        key={item.value}
                                        value={item.label || item.value}
                                        onSelect={() => {
                                            onChange(item.value);
                                            setOpen(false);
                                        }}
                                    >
                                        <Check
                                            className={cn(
                                                'mr-2 h-4 w-4',
                                                value === item.value
                                                    ? 'opacity-100'
                                                    : 'opacity-0',
                                            )}
                                        />
                                        <div className="flex items-center">
                                            {displayRender(item)}
                                        </div>
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
