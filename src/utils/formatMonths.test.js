import { describe, expect, it } from 'vitest';
import { ALL_MONTHS_ABBR, getActiveMonthSet, formatBestMonths } from './formatMonths';

describe('getActiveMonthSet', () => {
  it('returns an empty Set when bestMonths is falsy', () => {
    expect(getActiveMonthSet(null)).toEqual(new Set());
    expect(getActiveMonthSet(undefined)).toEqual(new Set());
    expect(getActiveMonthSet('')).toEqual(new Set());
  });

  it('maps full month names to abbreviations', () => {
    const result = getActiveMonthSet('February,March,April');
    expect(result).toEqual(new Set(['Feb', 'Mar', 'Apr']));
  });

  it('trims whitespace around month names', () => {
    const result = getActiveMonthSet(' January , December ');
    expect(result).toEqual(new Set(['Jan', 'Dec']));
  });

  it('falls back to the raw token when it is not a known month name', () => {
    const result = getActiveMonthSet('NotAMonth');
    expect(result).toEqual(new Set(['NotAMonth']));
  });
});

describe('formatBestMonths', () => {
  it('returns null when bestMonths is falsy', () => {
    expect(formatBestMonths(null)).toBeNull();
    expect(formatBestMonths(undefined)).toBeNull();
    expect(formatBestMonths('')).toBeNull();
  });

  it('returns null when the string contains no usable months', () => {
    expect(formatBestMonths('  ,  ,')).toBeNull();
  });

  it('returns a single abbreviation when only one month is given', () => {
    expect(formatBestMonths('July')).toBe('Jul');
  });

  it('formats a multi-month list as a range from first to last', () => {
    expect(formatBestMonths('January,February,March,April')).toBe('Jan-Apr');
  });
});

describe('ALL_MONTHS_ABBR', () => {
  it('contains all twelve abbreviated month names in order', () => {
    expect(ALL_MONTHS_ABBR).toHaveLength(12);
    expect(ALL_MONTHS_ABBR[0]).toBe('Jan');
    expect(ALL_MONTHS_ABBR[11]).toBe('Dec');
  });
});
