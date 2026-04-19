import { ChevronLeft, ChevronRight } from 'lucide-react';
import React from 'react';
import { Button } from '@/components/ui/button';

interface DataTablePaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export function DataTablePagination({
    currentPage,
    totalPages,
    onPageChange,
}: DataTablePaginationProps) {
    if (totalPages <= 1) {
        return null;
    }

    return (
        <div className="flex items-center justify-end space-x-2 py-4">
            <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
            >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Előző
            </Button>
            <div className="px-2 text-sm font-medium text-muted-foreground">
                {currentPage} / {totalPages}
            </div>
            <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
            >
                Következő
                <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
        </div>
    );
}
