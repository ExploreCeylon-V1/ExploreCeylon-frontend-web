import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useCountUp } from './useCountUp';

describe('useCountUp', () => {
  let intersectionCallback;

  beforeEach(() => {
    intersectionCallback = null;
    globalThis.IntersectionObserver = vi.fn(function MockIntersectionObserver(callback) {
      intersectionCallback = callback;
      this.observe = vi.fn();
      this.disconnect = vi.fn();
    });

    window.matchMedia = vi.fn().mockReturnValue({ matches: false });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('starts at 0 before the node intersects the viewport', () => {
    const { result } = renderHook(() => useCountUp(100, 1000));
    const [, value] = result.current;
    expect(value).toBe(0);
  });

  it('counts up to the target value once the node scrolls into view', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useCountUp(100, 1000));
    const [ref] = result.current;

    act(() => {
      ref(document.createElement('div'));
    });

    act(() => {
      intersectionCallback([{ isIntersecting: true }]);
    });

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    const [, value] = result.current;
    expect(value).toBe(100);
  });

  it('does nothing before the node intersects, even with time advanced', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useCountUp(100, 1000));
    const [ref] = result.current;

    act(() => {
      ref(document.createElement('div'));
    });

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    const [, value] = result.current;
    expect(value).toBe(0);
  });

  it('jumps straight to the target when prefers-reduced-motion is set', () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true });
    const { result } = renderHook(() => useCountUp(42));
    const [ref] = result.current;

    act(() => {
      ref(document.createElement('div'));
    });

    act(() => {
      intersectionCallback([{ isIntersecting: true }]);
    });

    const [, value] = result.current;
    expect(value).toBe(42);
  });
});
