import { useCallback, useEffect, useState } from "react";

/**
 * Animates a number counting up from 0 to `target` once the returned ref
 * scrolls into view. Respects prefers-reduced-motion (jumps straight to target).
 *
 * Usage: const [ref, value] = useCountUp(42);
 * Attach `ref` to the element that displays `value`.
 *
 * NOTE: `ref` is a *callback ref* (not a useRef object). This is deliberate:
 * the counters live inside a section that is unmounted while stats are loading
 * (`statsLoading ? "Loading stats..." : <grid/>`). With a plain useRef the
 * observer-attaching effect would run while the node was still null — for any
 * stat whose value arrived *before* the section mounted, the effect bailed on
 * `!ref.current` and never re-ran (its `target` had already stopped changing),
 * so the counter was stuck at 0 forever. A callback ref re-runs the effect the
 * moment the node actually mounts, so the observer always attaches. See #stats.
 */
export function useCountUp(target, duration = 1500) {
  const [value, setValue] = useState(0);
  const [node, setNode] = useState(null);
  const ref = useCallback((n) => setNode(n), []);

  useEffect(() => {
    if (!node) return undefined;

    let frame;
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const runAnimation = () => {
      if (prefersReducedMotion) {
        setValue(target);
        return;
      }
      const start = performance.now();
      const step = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        setValue(Math.round(target * eased));
        if (progress < 1) frame = requestAnimationFrame(step);
      };
      frame = requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          runAnimation();
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(node);

    return () => {
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [node, target, duration]);

  return [ref, value];
}
