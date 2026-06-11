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
import type { DiscordRole } from '@/types';

interface RoleSelectProps {
    roles: DiscordRole[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyPlaceholder?: string;
    className?: string;
}

export function RoleSelect({
    roles,
    value,
    onChange,
    placeholder = 'Válassz egy rangot...',
    searchPlaceholder = 'Rang keresése...',
    emptyPlaceholder = 'Nincs találat.',
    className,
}: RoleSelectProps) {
    const [open, setOpen] = React.useState(false);

    const sortedRoles = React.useMemo(
        () => [...roles].sort((a, b) => b.position - a.position),
        [roles],
    );

    const selectedRole = sortedRoles.find((role) => role.id === value);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn('w-full justify-between', className)}
                >
                    {selectedRole ? (
                        <div className="flex items-center">
                            <div
                                className="mr-2 h-4 w-4 rounded-full"
                                style={{
                                    backgroundColor:
                                        selectedRole.color || '#99AAB5',
                                }}
                            />
                            {selectedRole.name}
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
                            {sortedRoles.map((role) => (
                                <CommandItem
                                    key={role.id}
                                    value={role.name}
                                    onSelect={() => {
                                        onChange(role.id);
                                        setOpen(false);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            'mr-2 h-4 w-4',
                                            value === role.id
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
