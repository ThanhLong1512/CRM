"use client";

import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  itemLabel?: string;
  compact?: boolean;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  startIndex,
  endIndex,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50],
  itemLabel = "kết quả",
  compact = false,
  className = "",
}: PaginationProps) {
  if (totalItems <= 0) return null;

  // Generate page numbers with ellipsis (e.g. 1, 2, ..., 5, 6, 7, ..., 12)
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      if (start > 2) pages.push("...");
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 1) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div
      className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-3 pb-1 border-t border-slate-200 text-xs text-slate-600 select-none ${className}`}
    >
      {/* Left: Summary and Page Size */}
      <div className="flex items-center justify-between sm:justify-start gap-3">
        <span>
          Hiển thị{" "}
          <strong className="font-bold text-slate-900">
            {totalItems > 0 ? startIndex + 1 : 0} - {endIndex}
          </strong>{" "}
          / <strong className="font-bold text-slate-900">{totalItems}</strong>{" "}
          {itemLabel}
        </span>

        {onPageSizeChange && !compact && (
          <div className="flex items-center gap-1.5 ml-2">
            <span className="text-slate-400 hidden md:inline">|</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              aria-label="Số bản ghi mỗi trang"
              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 shadow-2xs hover:border-slate-300 focus:border-amber-500 focus:outline-hidden cursor-pointer"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt} / trang
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right: Navigation Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center sm:justify-end gap-1">
          {/* Mobile view: simple Prev/Next with indicator */}
          <div className="flex items-center gap-1 sm:hidden">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => onPageChange(currentPage - 1)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 disabled:opacity-40 disabled:pointer-events-none hover:bg-slate-50 cursor-pointer shadow-2xs"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Trước</span>
            </button>

            <span className="px-3 py-1 font-mono font-bold text-slate-900 bg-slate-100 rounded-lg">
              {currentPage} / {totalPages}
            </span>

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange(currentPage + 1)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 disabled:opacity-40 disabled:pointer-events-none hover:bg-slate-50 cursor-pointer shadow-2xs"
            >
              <span>Sau</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Desktop view: full numbered pills */}
          <div className="hidden sm:flex items-center gap-1">
            {/* First */}
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => onPageChange(1)}
              title="Trang đầu"
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none cursor-pointer shadow-2xs transition-colors"
            >
              <ChevronsLeft className="w-3.5 h-3.5" />
            </button>

            {/* Prev */}
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => onPageChange(currentPage - 1)}
              title="Trang trước"
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none cursor-pointer shadow-2xs transition-colors mr-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            {/* Numbers */}
            {pages.map((p, idx) => {
              if (p === "...") {
                return (
                  <span
                    key={`ellipsis-${idx}`}
                    className="px-2 py-1 text-slate-400 font-bold"
                  >
                    …
                  </span>
                );
              }

              const isCurrent = p === currentPage;
              return (
                <button
                  key={`page-${p}`}
                  type="button"
                  onClick={() => onPageChange(Number(p))}
                  className={`min-w-8 h-8 px-2 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                    isCurrent
                      ? "bg-amber-500 text-slate-950 shadow-xs ring-1 ring-amber-400"
                      : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100/80 shadow-2xs"
                  }`}
                >
                  {p}
                </button>
              );
            })}

            {/* Next */}
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange(currentPage + 1)}
              title="Trang sau"
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none cursor-pointer shadow-2xs transition-colors ml-1"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            {/* Last */}
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange(totalPages)}
              title="Trang cuối"
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none cursor-pointer shadow-2xs transition-colors"
            >
              <ChevronsRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Pagination;
