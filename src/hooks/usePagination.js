import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * Tailwind's default breakpoints (tailwind.config.js is empty, so v4 defaults
 * apply). Ordered widest-first so `columnsFor` can return on the first match.
 */
const BREAKPOINTS = [
  ["xl", 1280],
  ["lg", 1024],
  ["md", 768],
  ["sm", 640],
];

/**
 * Resolve how many columns the grid renders at the current viewport width.
 *
 * `columns` mirrors the Tailwind classes on the list container, e.g. a grid
 * marked `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` is `{ base: 1, md: 2, lg: 3 }`.
 * Keys are inherited upward exactly like Tailwind does it: with no `xl` key an
 * xl viewport falls back to the `lg` value.
 */
function columnsFor(columns, width) {
  for (const [name, minWidth] of BREAKPOINTS) {
    if (width >= minWidth && columns[name] != null) return columns[name];
  }
  return columns.base ?? 1;
}

const getViewportWidth = () =>
  typeof window === "undefined" ? 0 : window.innerWidth;

/**
 * Row-based client-side pagination for lists that are fetched in full.
 *
 * Page size is derived from the grid's *responsive column count* rather than
 * being a fixed item count, so a 3-column desktop grid shows the same number of
 * ROWS as a 1-column phone layout instead of the same number of cards.
 *
 * @param {Array}  items          the full, already-filtered list
 * @param {Object} options
 * @param {Object} options.columns column count per breakpoint, e.g. { base: 1, md: 2, lg: 3 }
 * @param {number} [options.rows]  target rows per page (default 10)
 *
 * @returns {{
 *   pageItems: Array, page: number, totalPages: number, pageSize: number,
 *   setPage: (n: number) => void, listRef: import('react').RefObject<HTMLElement>
 * }}
 *
 * Attach `listRef` to the top of the results region — changing page scrolls
 * that element into view rather than jumping the whole window to the top.
 */
export function usePagination(items, { columns, rows = 10 } = {}) {
  // Memoized so a nullish `items` doesn't mint a fresh [] on every render —
  // the reset-to-page-1 effect below keys on this array's identity.
  const list = useMemo(() => items ?? [], [items]);
  const [page, setPage] = useState(1);
  const [width, setWidth] = useState(getViewportWidth);
  const listRef = useRef(null);

  // Only re-render when the *column count* changes, not on every resize pixel.
  const columnCount = columnsFor(columns ?? { base: 1 }, width);
  const pageSize = Math.max(1, columnCount * rows);

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const totalPages = Math.max(1, Math.ceil(list.length / pageSize));

  // Reset to page 1 whenever the underlying list changes identity — filters,
  // search and sort all produce a new array, so this covers all three.
  // Keyed on the array reference, so callers must memoize their filtered list
  // (all six pages already build theirs inside a useMemo).
  const isFirstRun = useRef(true);
  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    setPage(1);
  }, [list]);

  // Page size can shrink under us — crossing a breakpoint down, or flipping a
  // grid/list view toggle. Clamping at render (rather than in an effect that
  // writes back to state) means the user never sees a frame of empty list, and
  // the stale-high `page` is harmless: every consumer reads `currentPage`, and
  // goToPage re-clamps against the current totalPages.
  const currentPage = Math.min(page, totalPages);

  const pageItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return list.slice(start, start + pageSize);
  }, [list, currentPage, pageSize]);

  const goToPage = useCallback(
    (next) => {
      const clamped = Math.min(Math.max(1, next), totalPages);
      setPage(clamped);
      // Scroll the results region, not the window — filters above the list stay
      // put. `block: "start"` lands on the top of the list itself.
      listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [totalPages]
  );

  return {
    pageItems,
    page: currentPage,
    totalPages,
    pageSize,
    setPage: goToPage,
    listRef,
  };
}

export default usePagination;
