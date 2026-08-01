import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Build the page-button sequence: always first and last, the current page ±1,
 * and "…" placeholders for the gaps. Returns numbers and the strings
 * "gap-start" / "gap-end" (unique keys, since a run can appear on both sides).
 */
function buildPageList(page, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);

  if (start > 2) pages.push("gap-start");
  for (let p = start; p <= end; p += 1) pages.push(p);
  if (end < totalPages - 1) pages.push("gap-end");

  pages.push(totalPages);
  return pages;
}

/**
 * Shared pagination control for the public listing pages.
 *
 * Pairs with `usePagination` — pass through its `page`, `totalPages` and
 * `setPage`. Renders nothing for a single page. Style matches the emerald
 * button tokens used across the site.
 *
 * @param {number}   page       current page, 1-indexed
 * @param {number}   totalPages total page count
 * @param {Function} onPageChange called with the new 1-indexed page
 * @param {string}   [label]    describes the list, for the nav's aria-label
 *                              (e.g. "guides" → "Guides pagination")
 */
export default function Pagination({
  page,
  totalPages,
  onPageChange,
  label = "results",
  className = "",
}) {
  if (totalPages <= 1) return null;

  const pages = buildPageList(page, totalPages);
  const arrowClasses =
    "p-2 rounded-lg border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2";

  return (
    <nav
      aria-label={`${label} pagination`}
      className={`flex items-center justify-center gap-2 mt-8 ${className}`}
    >
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label="Go to previous page"
        className={arrowClasses}
      >
        <ChevronLeft size={16} aria-hidden="true" />
      </button>

      {pages.map((entry) =>
        typeof entry === "string" ? (
          <span key={entry} aria-hidden="true" className="px-1 text-gray-400">
            …
          </span>
        ) : (
          <button
            key={entry}
            type="button"
            onClick={() => onPageChange(entry)}
            aria-label={`Go to page ${entry}`}
            aria-current={entry === page ? "page" : undefined}
            className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 ${
              entry === page
                ? "bg-emerald-800 text-white"
                : "border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {entry}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Go to next page"
        className={arrowClasses}
      >
        <ChevronRight size={16} aria-hidden="true" />
      </button>
    </nav>
  );
}
