import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE_OPTIONS = [12, 24, 48];

function buildPageNumbers(current, total) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages = [];
  pages.push(1);

  if (current > 3) pages.push("...");

  const start = Math.max(2, current - 2);
  const end = Math.min(total - 1, current + 2);

  for (let i = start; i <= end; i++) {
    if (!pages.includes(i)) pages.push(i);
  }

  if (current < total - 2) pages.push("...");

  if (!pages.includes(total)) pages.push(total);

  return pages;
}

const Pagination = ({
  currentPage,
  totalPages,
  totalElements,
  pageSize,
  onPageChange,
  onPageSizeChange,
}) => {
  const pageNumbers = useMemo(
    () => buildPageNumbers(currentPage + 1, totalPages),
    [currentPage, totalPages]
  );

  if (totalPages <= 0) return null;

  const startElement = totalElements === 0 ? 0 : currentPage * pageSize + 1;
  const endElement = Math.min((currentPage + 1) * pageSize, totalElements);

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-6">
      <div className="text-sm text-muted">
        Showing {startElement}–{endElement} of {totalElements} results
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={currentPage === 0}
          onClick={() => onPageChange?.(currentPage - 1)}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-default bg-surface-card px-4 py-2 text-sm text-primary transition-colors hover:bg-surface-elevated disabled:opacity-40 disabled:cursor-not-allowed dark:shadow-none"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Previous</span>
        </button>

        {pageNumbers.map((page, idx) =>
          page === "..." ? (
            <span
              key={`ellipsis-${idx}`}
              className="px-2 py-2 text-sm text-muted"
            >
              ...
            </span>
          ) : (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange?.(page - 1)}
              className={`min-w-[40px] px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                page === currentPage + 1
                  ? "bg-primary text-white shadow-sm transition-colors hover:bg-primary-hover disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:shadow-none"
                  : "border border-default bg-surface-card text-primary transition-colors hover:bg-surface-elevated disabled:opacity-40 disabled:cursor-not-allowed"
              }`}
            >
              {page}
            </button>
          )
        )}

        <button
          type="button"
          disabled={currentPage >= totalPages - 1}
          onClick={() => onPageChange?.(currentPage + 1)}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-default bg-surface-card px-4 py-2 text-sm text-primary transition-colors hover:bg-surface-elevated disabled:opacity-40 disabled:cursor-not-allowed dark:shadow-none"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>

        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
          className="ml-2 w-20 rounded-lg border border-default bg-surface-card px-3 py-2 text-sm text-primary placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>
              {size} / page
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default Pagination;
