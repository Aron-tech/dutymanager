import { Check, ChevronsUpDown, X } from 'lucide-react';
import * as React from 'react';
import { Badge } from '@/components/ui/badge';
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
import type { DiscordRole } from '@/types';

interface MultiRoleSelectProps {
    roles: DiscordRole[];
    value: string[];
    onChange: (value: string[]) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyPlaceholder?: string;
    className?: string;
    useSelectionOrder?: boolean;
}

export function MultiRoleSelect({
    roles,
    value,
    onChange,
    placeholder = 'Válassz rangokat...',
    searchPlaceholder = 'Rang keresése...',
    emptyPlaceholder = 'Nincs találat.',
    className,
    useSelectionOrder = false,
}: MultiRoleSelectProps) {
    const [open, setOpen] = React.useState(false);

    const sortedRoles = React.useMemo(
        () => [...roles].sort((a, b) => (b.position ?? 0) - (a.position ?? 0)),
        [roles],
    );

    const handleSelect = (roleId: string | number) => {
        const idStr = String(roleId);
        const newValue = value.map(String).includes(idStr)
            ? value.filter((id) => String(id) !== idStr)
            : [...value, idStr];
        onChange(newValue);
    };

    const getRoleColor = (color: string | number | undefined | null) => {
        if (!color) {
            return undefined;
        }

        if (typeof color === 'number') {
            return `#${color.toString(16).padStart(6, '0')}`;
        }

        return color as string;
    };

    const selectedRoles = React.useMemo(() => {
        const valueStrings = value.map(String);
        if (useSelectionOrder) {
            // Sorrend a `value` tömb alapján
            return valueStrings
                .map((id) => roles.find((role) => String(role.id) === id))
                .filter((role): role is DiscordRole => role !== undefined);
        }

        // Eredeti sorrend (pozíció szerint)
        return sortedRoles.filter((role) => valueStrings.includes(String(role.id)));
    }, [value, roles, sortedRoles, useSelectionOrder]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        'h-auto min-h-10 w-full justify-between py-2',
                        className,
                    )}
                >
                    <div className="flex flex-wrap items-center gap-1.5">
                        {selectedRoles.length > 0 ? (
                            selectedRoles.map((role, index) => {
                                const hexColor = getRoleColor(role.color);

                                return (
                                    <Badge
                                        key={role.id}
                                        variant="secondary"
                                        className={cn(
                                            'flex items-center',
                                            useSelectionOrder
                                                ? 'gap-1.5 px-2 py-1'
                                                : 'gap-1',
                                        )}
                                    >
                                        {useSelectionOrder && (
                                            <>
                                                <span className="text-xs font-semibold opacity-70">
                                                    {index + 1}.
                                                </span>
                                                <div
                                                    className="h-2 w-2 rounded-full"
                                                    style={{
                                                        backgroundColor:
                                                            hexColor ||
                                                            '#99AAB5',
                                                    }}
                                                />
                                            </>
                                        )}
                                        <span>{role.name}</span>
                                        <button
                                            type="button"
                                            className="ml-1 rounded-full p-0.5 ring-offset-background transition-colors outline-none hover:bg-black/10 focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    handleSelect(role.id);
                                                }
                                            }}
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                            }}
                                            onClick={() =>
                                                handleSelect(role.id)
                                            }
                                        >
                                            <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                        </button>
                                    </Badge>
                                );
                            })
                        ) : (
                            <span className="text-muted-foreground">
                                {placeholder}
                            </span>
                        )}
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                    <CommandInput placeholder={searchPlaceholder} />
                    <CommandList>
                        <CommandEmpty>{emptyPlaceholder}</CommandEmpty>
                        <CommandGroup>
                            {sortedRoles.map((role) => {
                                const hexColor =
                                    getRoleColor(role.color) || '#99AAB5';

                                return (
                                    <CommandItem
                                        key={role.id}
                                        value={role.name}
                                        onSelect={() => handleSelect(role.id)}
                                    >
                                        <Check
                                            className={cn(
                                                'mr-2 h-4 w-4',
                                                value.map(String).includes(String(role.id))
                                                    ? 'opacity-100'
                                                    : 'opacity-0',
                                            )}
                                        />
                                        <div className="flex items-center">
                                            {role.name}
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
