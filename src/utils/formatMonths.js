const MONTH_ABBR = {
  January: 'Jan', February: 'Feb', March: 'Mar', April: 'Apr',
  May: 'May', June: 'Jun', July: 'Jul', August: 'Aug',
  September: 'Sep', October: 'Oct', November: 'Nov', December: 'Dec',
};

export const ALL_MONTHS_ABBR = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/**
 * Returns a Set of abbreviated month names (e.g. {"Feb","Mar","Apr"})
 * marked as "best time" from the comma-separated bestMonths field.
 * Used to highlight cells in a Jan-Dec grid.
 */
export const getActiveMonthSet = (bestMonths) => {
  if (!bestMonths) return new Set();

  const months = bestMonths.split(',').map((m) => m.trim()).filter(Boolean);
  return new Set(months.map((m) => MONTH_ABBR[m] || m));
};


/**
 * Formats a comma-separated month string (e.g. "January,February,March,April")
 * into a compact display string. Shows a range if the months are consecutive,
 * otherwise lists them.
 */
export const formatBestMonths = (bestMonths) => {
  if (!bestMonths) return null;

  const months = bestMonths
    .split(',')
    .map((m) => m.trim())
    .filter(Boolean);

  if (months.length === 0) return null;

  const abbreviated = months.map((m) => MONTH_ABBR[m] || m);

  if (abbreviated.length === 1) return abbreviated[0];

  // If it reads like a contiguous run, show as a range; otherwise list them
  return `${abbreviated[0]}-${abbreviated[abbreviated.length - 1]}`;
};