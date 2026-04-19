import { useState, useMemo } from 'react';

export function useClientPagination<T>(data: T[], itemsPerPage: number = 10) {
    const [page, setPage] = useState(1);


    const totalPages = Math.max(1, Math.ceil(data.length / itemsPerPage));

    const currentPage = Math.min(page, totalPages);

    const currentData = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;

        return data.slice(start, start + itemsPerPage);
    }, [data, currentPage, itemsPerPage]);

    const handleSetPage = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPage(newPage);
        }
    };

    return {
        currentData,
        currentPage,
        totalPages,
        setPage: handleSetPage,
        nextPage: () => handleSetPage(currentPage + 1),
        prevPage: () => handleSetPage(currentPage - 1),
    };
}
