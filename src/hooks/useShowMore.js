import { useState, useEffect, useCallback } from "react";

/**
 * Custom hook to manage progressive "Show More" list pagination.
 *
 * @param {Array} items - The full array of items to slice.
 * @param {Object} options
 * @param {number} [options.initialCount=5] - Number of items to display initially.
 * @param {number} [options.increment=5] - Number of additional items to reveal per click.
 * @param {Array} [options.resetDeps=[]] - Array of filter/search values that trigger a reset to initialCount.
 */
export function useShowMore(items = [], options = {}) {
  const { initialCount = 5, increment = 5, resetDeps = [] } = options;

  const [visibleCount, setVisibleCount] = useState(initialCount);

  // Reset visibleCount back to initialCount whenever resetDeps change
  useEffect(() => {
    setVisibleCount(initialCount);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCount, ...resetDeps]);

  const totalCount = Array.isArray(items) ? items.length : 0;
  const visibleItems = Array.isArray(items)
    ? items.slice(0, visibleCount)
    : [];

  const hasMore = visibleCount < totalCount;
  const remainingCount = Math.max(0, totalCount - visibleCount);

  const showMore = useCallback(() => {
    setVisibleCount((prev) => prev + increment);
  }, [increment]);

  const reset = useCallback(() => {
    setVisibleCount(initialCount);
  }, [initialCount]);

  return {
    visibleItems,
    visibleCount,
    totalCount,
    hasMore,
    remainingCount,
    showMore,
    reset,
  };
}

export default useShowMore;
