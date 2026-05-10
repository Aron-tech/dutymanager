// data-table-toolbar.tsx
import { Search, SlidersHorizontal } from 'lucide-react';
import React from 'react';
import { Button } from '@/components/ui/button';
import {
    Combobox,
    ComboboxChip,
    ComboboxChips,
    ComboboxChipsInput,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxItem,
    ComboboxList,
    ComboboxValue,
    useComboboxAnchor,
} from '@/components/ui/combobox';
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

interface StatusOption {
    label: string;
    value: string;
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
    show_status_filter?: boolean;
    status_options?: StatusOption[];
    status_filters?: string[];
    onStatusFilterChange?: (values: string[]) => void;
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
                                     show_status_filter = false,
                                     status_options = [],
                                     status_filters = [],
                                     onStatusFilterChange,
                                 }: DataTableToolbarProps) {
    const status_anchor = useComboboxAnchor();

    return (
        <div className="flex flex-col md:flex-row flex-wrap items-start md:items-center gap-3 w-full">
            <div className="relative w-full md:w-64 shrink-0">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Keresés..."
                    className="pl-9 w-full"
                    value={search_query}
                    onChange={(e) => onSearchChange(e.target.value)}
                />
            </div>

            {show_date_filter && (
                <div className="flex w-full md:w-auto items-center gap-2 shrink-0">
                    <Input
                        type="date"
                        value={date_from}
                        onChange={(e) => onDateFromChange?.(e.target.value)}
                        className="flex-1 md:w-[140px]"
                        title="Kezdő dátum"
                    />
                    <span className="text-muted-foreground shrink-0">-</span>
                    <Input
                        type="date"
                        value={date_to}
                        onChange={(e) => onDateToChange?.(e.target.value)}
                        className="flex-1 md:w-[140px]"
                        title="Vég dátum"
                    />
                </div>
            )}

            {show_status_filter && onStatusFilterChange && (
                <div className="w-full md:w-[250px] shrink-0">
                    <Combobox
                        multiple
                        items={status_options.map((o) => o.value)}
                        value={status_filters}
                        onValueChange={(val) => onStatusFilterChange(val as string[])}
                    >
                        <ComboboxChips ref={status_anchor} className="w-full min-h-10">
                            <ComboboxValue>
                                {(values: string[]) => (
                                    <React.Fragment>
                                        {values.map((val) => (
                                            <ComboboxChip key={val}>
                                                {status_options.find((o) => o.value === val)?.label}
                                            </ComboboxChip>
                                        ))}
                                        <ComboboxChipsInput placeholder="Státusz szűrő..." />
                                    </React.Fragment>
                                )}
                            </ComboboxValue>
                        </ComboboxChips>
                        <ComboboxContent anchor={status_anchor}>
                            <ComboboxEmpty>Nincs ilyen státusz.</ComboboxEmpty>
                            <ComboboxList>
                                {(item: string) => (
                                    <ComboboxItem key={item} value={item}>
                                        {status_options.find((o) => o.value === item)?.label}
                                    </ComboboxItem>
                                )}
                            </ComboboxList>
                        </ComboboxContent>
                    </Combobox>
                </div>
            )}

            <div className="flex flex-wrap w-full md:w-auto items-center gap-2 ml-auto shrink-0">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="flex-1 md:flex-none items-center gap-2 justify-center">
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
                                disabled={
                                    col.id === 'ic_name' ||
                                    col.id === 'action' ||
                                    col.id === 'type' ||
                                    col.id === 'reason' ||
                                    col.id === 'created_at' ||
                                    col.id === 'started_at'
                                }
                            >
                                {col.label} {col?.is_dynamic && !col.required && '(Opcionális)'}
                            </DropdownMenuCheckboxItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>

                <div className="flex flex-1 md:flex-none items-center gap-2">
                    <Select value={per_page_amount} onValueChange={onPerPageChange}>
                        <SelectTrigger className="w-full md:w-[100px]">
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
                            className="w-16 shrink-0"
                            value={custom_per_page}
                            onChange={(e) => onCustomPerPageChange(e.target.value)}
                            onKeyDown={onCustomPerPageSubmit}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
