import { useState, useMemo, useEffect, useCallback } from "react";

export interface UsePaginationOptions {
  initialPage?: number;
  initialPageSize?: number;
  pageSizeOptions?: number[];
}

export interface UsePaginationConfig<T> {
  items: T[];
  initialPage?: number;
  initialPageSize?: number;
  pageSizeOptions?: number[];
}

export interface UsePaginationResult<T> {
  currentPage: number;
  setCurrentPage: (page: number | ((prev: number) => number)) => void;
  goToPage: (page: number | ((prev: number) => number)) => void;
  pageSize: number;
  setPageSize: (size: number) => void;
  totalPages: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
  paginatedItems: T[];
  hasPrev: boolean;
  hasNext: boolean;
  goToNext: () => void;
  goToPrev: () => void;
  resetPage: () => void;
}

export function usePagination<T>(
  config: UsePaginationConfig<T>
): UsePaginationResult<T>;
export function usePagination<T>(
  items: T[],
  options?: UsePaginationOptions
): UsePaginationResult<T>;
export function usePagination<T>(
  itemsOrConfig: T[] | UsePaginationConfig<T>,
  options?: UsePaginationOptions
): UsePaginationResult<T> {
  const isArray = Array.isArray(itemsOrConfig);
  const items: T[] = isArray ? itemsOrConfig : itemsOrConfig.items;
  const initialPage = isArray
    ? options?.initialPage ?? 1
    : itemsOrConfig.initialPage ?? 1;
  const initialPageSize = isArray
    ? options?.initialPageSize ?? 10
    : itemsOrConfig.initialPageSize ?? 10;

  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // If current page exceeds total pages due to filter changes, auto-clamp
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  const paginatedItems = useMemo(() => {
    return items.slice(startIndex, endIndex);
  }, [items, startIndex, endIndex]);

  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  const goToNext = useCallback(() => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  }, [totalPages]);

  const goToPrev = useCallback(() => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  }, []);

  const resetPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  return {
    currentPage,
    setCurrentPage,
    goToPage: setCurrentPage,
    pageSize,
    setPageSize,
    totalPages,
    totalItems,
    startIndex,
    endIndex,
    paginatedItems,
    hasPrev,
    hasNext,
    goToNext,
    goToPrev,
    resetPage,
  };
}

export default usePagination;
