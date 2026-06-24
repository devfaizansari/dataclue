"use client";

type PaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
};

function getVisiblePages(page: number, totalPages: number): number[] {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set<number>([1, totalPages, page, page - 1, page + 1]);
  return [...pages].filter((value) => value >= 1 && value <= totalPages).sort((a, b) => a - b);
}

export default function Pagination({
  page,
  totalPages,
  onPageChange,
  className = "",
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const visiblePages = getVisiblePages(page, totalPages);

  return (
    <nav
      className={`flex flex-col items-center gap-3 sm:flex-row sm:justify-between ${className}`}
      aria-label="Pagination"
    >
      <p className="text-sm text-muted">
        Page <span className="font-medium text-foreground">{page}</span> of{" "}
        <span className="font-medium text-foreground">{totalPages}</span>
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>

        <div className="flex items-center gap-1">
          {visiblePages.map((pageNumber, index) => {
            const previous = visiblePages[index - 1];
            const showEllipsis = previous !== undefined && pageNumber - previous > 1;

            return (
              <span key={pageNumber} className="flex items-center gap-1">
                {showEllipsis && <span className="px-1 text-sm text-muted">…</span>}
                <button
                  type="button"
                  onClick={() => onPageChange(pageNumber)}
                  aria-current={pageNumber === page ? "page" : undefined}
                  className={`min-w-9 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                    pageNumber === page
                      ? "border-primary bg-primary text-white"
                      : "border-border bg-surface text-foreground hover:bg-surface-muted"
                  }`}
                >
                  {pageNumber}
                </button>
              </span>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </nav>
  );
}
