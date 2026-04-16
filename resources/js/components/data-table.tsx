import React from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

export interface ColumnDef<T> {
    id: string;
    label: string;
    sortable?: boolean;
    render?: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
    data: T[];
    columns: ColumnDef<T>[];
    key_field?: keyof T;
    selected_rows?: (string | number)[];
    onSelectionChange?: (ids: (string | number)[]) => void;
    sort_column?: string;
    sort_direction?: string;
    onSort?: (col_id: string) => void;
    actions?: (row: T) => React.ReactNode;
    empty_message?: string;
}

export function DataTable<T extends Record<string, any>>({
                                                             data,
                                                             columns,
                                                             key_field = 'id',
                                                             selected_rows = [],
                                                             onSelectionChange,
                                                             sort_column,
                                                             sort_direction,
                                                             onSort,
                                                             actions,
                                                             empty_message = 'Nincs megjeleníthető adat.',
                                                         }: DataTableProps<T>) {
    const is_all_selected = data.length > 0 && selected_rows.length === data.length;

    const handleSelectAll = () => {
        if (!onSelectionChange) return;
        if (is_all_selected) {
            onSelectionChange([]);
        } else {
            onSelectionChange(data.map((row) => row[key_field as string]));
        }
    };

    const handleSelectRow = (id: string | number) => {
        if (!onSelectionChange) return;
        if (selected_rows.includes(id)) {
            onSelectionChange(selected_rows.filter((row_id) => row_id !== id));
        } else {
            onSelectionChange([...selected_rows, id]);
        }
    };

    return (
        <div className="overflow-x-auto rounded-md border bg-card">
            <table className="w-full text-left text-sm">
                <thead className="border-b bg-muted/50 text-foreground">
                <tr>
                    {onSelectionChange && (
                        <th className="w-10 p-3">
                            <Checkbox
                                checked={is_all_selected}
                                onCheckedChange={handleSelectAll}
                            />
                        </th>
                    )}
                    {columns.map((col) => (
                        <th
                            key={col.id}
                            className={`p-3 font-medium whitespace-nowrap select-none ${
                                col.sortable ? 'group cursor-pointer transition-colors hover:bg-muted/80' : ''
                            }`}
                            onClick={() => col.sortable && onSort && onSort(col.id)}
                        >
                            <div className="flex items-center gap-2">
                                {col.label}
                                {col.sortable && sort_column === col.id ? (
                                    sort_direction === 'asc' ? (
                                        <ArrowUp className="h-4 w-4" />
                                    ) : (
                                        <ArrowDown className="h-4 w-4" />
                                    )
                                ) : col.sortable ? (
                                    <ArrowUpDown className="h-3 w-3 text-muted-foreground/50 opacity-0 transition-opacity group-hover:opacity-100" />
                                ) : null}
                            </div>
                        </th>
                    ))}
                    {actions && <th className="w-16 p-3 text-center">Műveletek</th>}
                </tr>
                </thead>
                <tbody className="divide-y">
                {data.length === 0 ? (
                    <tr>
                        <td
                            colSpan={columns.length + (onSelectionChange ? 1 : 0) + (actions ? 1 : 0)}
                            className="p-4 text-center text-muted-foreground"
                        >
                            {empty_message}
                        </td>
                    </tr>
                ) : (
                    data.map((row, index) => {
                        const row_id = row[key_field as string];
                        return (
                            <tr key={row_id || index} className="hover:bg-muted/30">
                                {onSelectionChange && (
                                    <td className="p-3">
                                        <Checkbox
                                            checked={selected_rows.includes(row_id)}
                                            onCheckedChange={() => handleSelectRow(row_id)}
                                        />
                                    </td>
                                )}
                                {columns.map((col) => (
                                    <td key={col.id} className="p-3">
                                        {col.render ? col.render(row) : row[col.id] || '-'}
                                    </td>
                                ))}
                                {actions && <td className="p-3 text-right">{actions(row)}</td>}
                            </tr>
                        );
                    })
                )}
                </tbody>
            </table>
        </div>
    );
}
