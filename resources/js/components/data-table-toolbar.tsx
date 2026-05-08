import { Search, SlidersHorizontal } from 'lucide-react';
import React from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface ToolbarColumn {
    id: string;
    label: string;
    required?: boolean;
    is_dynamic?: boolean;
}

interface DataTableToolbarProps {
    search_query: string;
    onSearchChange: (value: string) => void;
    columns: ToolbarColumn[];
    visible_columns: string[];
    onToggleColumn: (id: string) => void;
    per_page_amount: string;
    onPerPageChange: (value: string) => void;
    custom_per_page: string;
    onCustomPerPageChange: (value: string) => void;
    onCustomPerPageSubmit: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    show_date_filter?: boolean;
    date_from?: string;
    onDateFromChange?: (value: string) => void;
    date_to?: string;
    onDateToChange?: (value: string) => void;
}

export function DataTableToolbar({
                                     search_query,
                                     onSearchChange,
                                     columns,
                                     visible_columns,
                                     onToggleColumn,
                                     per_page_amount,
                                     onPerPageChange,
                                     custom_per_page,
                                     onCustomPerPageChange,
                                     onCustomPerPageSubmit,
                                     show_date_filter = false,
                                     date_from = '',
                                     onDateFromChange,
                                     date_to = '',
                                     onDateToChange,
                                 }: DataTableToolbarProps) {
    return (
        <div className="flex flex-wrap items-center justify-end gap-3">
            <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Keresés..."
                    className="pl-9"
                    value={search_query}
                    onChange={(e) => onSearchChange(e.target.value)}
                />
            </div>

            {show_date_filter && (
                <div className="flex items-center gap-2">
                    <Input
                        type="date"
                        value={date_from}
                        onChange={(e) => onDateFromChange?.(e.target.value)}
                        className="w-[140px]"
                        title="Kezdő dátum"
                    />
                    <span className="text-muted-foreground">-</span>
                    <Input
                        type="date"
                        value={date_to}
                        onChange={(e) => onDateToChange?.(e.target.value)}
                        className="w-[140px]"
                        title="Vég dátum"
                    />
                </div>
            )}

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2">
                        <SlidersHorizontal className="h-4 w-4" /> Oszlopok
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Látható oszlopok</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {columns.map((col) => (
                        <DropdownMenuCheckboxItem
                            key={col.id}
                            checked={visible_columns.includes(col.id)}
                            onCheckedChange={() => onToggleColumn(col.id)}
                            disabled={col.id === 'ic_name' || col.id === 'action' || col.id === 'type' || col.id === 'reason' || col.id === 'created_at' || col.id === 'started_at'}
                        >
                            {col.label}{' '}
                            {col?.is_dynamic && !col.required && '(Opcionális)'}
                        </DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex items-center gap-2">
                <Select value={per_page_amount} onValueChange={onPerPageChange}>
                    <SelectTrigger className="w-[100px]">
                        <SelectValue placeholder="Sor/oldal" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="custom">Egyedi</SelectItem>
                    </SelectContent>
                </Select>
                {per_page_amount === 'custom' && (
                    <Input
                        type="number"
                        placeholder="db"
                        className="w-16"
                        value={custom_per_page}
                        onChange={(e) => onCustomPerPageChange(e.target.value)}
                        onKeyDown={onCustomPerPageSubmit}
                    />
                )}
            </div>
        </div>
    );
}
