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
}

export function MultiRoleSelect({
    roles,
    value,
    onChange,
    placeholder = 'Válassz rangokat...',
    searchPlaceholder = 'Rang keresése...',
    emptyPlaceholder = 'Nincs találat.',
    className,
}: MultiRoleSelectProps) {
    const [open, setOpen] = React.useState(false);

    const sortedRoles = React.useMemo(
        () => [...roles].sort((a, b) => b.position - a.position),
        [roles],
    );

    const handleSelect = (roleId: string) => {
        const newValue = value.includes(roleId)
            ? value.filter((id) => id !== roleId)
            : [...value, roleId];
        onChange(newValue);
    };

    const selectedRoles = sortedRoles.filter((role) => value.includes(role.id));

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn('w-full justify-between', className)}
                    onClick={() => setOpen(!open)}
                >
                    <div className="flex flex-wrap items-center gap-1">
                        {selectedRoles.length > 0 ? (
                            selectedRoles.map((role) => (
                                <Badge
                                    key={role.id}
                                    variant="secondary"
                                    className="flex items-center gap-1"
                                    style={{
                                        backgroundColor: role.color
                                            ? `${role.color}33`
                                            : undefined,
                                        borderColor: role.color || undefined,
                                    }}
                                >
                                    {role.name}
                                    <button
                                        className="rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                handleSelect(role.id);
                                            }
                                        }}
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                        }}
                                        onClick={() => handleSelect(role.id)}
                                    >
                                        <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                    </button>
                                </Badge>
                            ))
                        ) : (
                            <span>{placeholder}</span>
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
                            {sortedRoles.map((role) => (
                                <CommandItem
                                    key={role.id}
                                    value={role.name}
                                    onSelect={() => handleSelect(role.id)}
                                >
                                    <Check
                                        className={cn(
                                            'mr-2 h-4 w-4',
                                            value.includes(role.id)
                                                ? 'opacity-100'
                                                : 'opacity-0',
                                        )}
                                    />
                                    <div className="flex items-center">
                                        <div
                                            className="mr-2 h-4 w-4 rounded-full"
                                            style={{
                                                backgroundColor:
                                                    role.color || '#99AAB5',
                                            }}
                                        />
                                        {role.name}
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
