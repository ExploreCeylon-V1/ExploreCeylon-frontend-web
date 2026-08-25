// currencyUtils.js
// Centralized currency conversion and formatting utility for ExploreCeylon frontend.

export const DEFAULT_USD_TO_LKR_RATE = 325.0;

export const SUPPORTED_CURRENCIES = {
  USD: { symbol: "$", code: "USD", rateFromUsd: 1.0 },
  LKR: { symbol: "Rs. ", code: "LKR", rateFromUsd: DEFAULT_USD_TO_LKR_RATE },
  EUR: { symbol: "€", code: "EUR", rateFromUsd: 0.92 },
  GBP: { symbol: "£", code: "GBP", rateFromUsd: 0.79 },
};

/**
 * Format a numeric amount in USD (or specified currency)
 */
export function formatMoney(amount = 0, currency = "USD") {
  const num = typeof amount === "number" && !isNaN(amount) ? amount : 0;
  if (currency === "LKR") {
    return `LKR ${Math.round(num).toLocaleString()}`;
  }
  if (currency === "EUR") {
    return `€${num.toFixed(2)}`;
  }
  if (currency === "GBP") {
    return `£${num.toFixed(2)}`;
  }
  return `$${num.toFixed(2)}`;
}

/**
 * Convert USD amount to LKR
 */
export function usdToLkr(amountUsd = 0, rate = DEFAULT_USD_TO_LKR_RATE) {
  return (amountUsd || 0) * rate;
}

/**
 * Convert LKR amount to USD
 */
export function lkrToUsd(amountLkr = 0, rate = DEFAULT_USD_TO_LKR_RATE) {
  return rate > 0 ? (amountLkr || 0) / rate : 0;
}

/**
 * Format dual currency string e.g. "$1,250.00 (approx. LKR 406,250)"
 */
export function formatDualCurrency(amountUsd = 0, rate = DEFAULT_USD_TO_LKR_RATE) {
  const usdFormatted = formatMoney(amountUsd, "USD");
  const lkrVal = Math.round(usdToLkr(amountUsd, rate));
  return `${usdFormatted} (approx. LKR ${lkrVal.toLocaleString()})`;
}

/**
 * Normalize trip estimated cost (USD) vs user target budget (LKR)
 */
export function normalizeTripBudget(totalCostUsd = 0, budgetAmountLkr = null, rate = DEFAULT_USD_TO_LKR_RATE) {
  const totalCostLkr = usdToLkr(totalCostUsd, rate);
  const budgetUsd = budgetAmountLkr ? lkrToUsd(budgetAmountLkr, rate) : null;

  return {
    totalCostUsd,
    totalCostLkr,
    budgetAmountLkr,
    budgetUsd,
    displayEstimatedTotal: formatDualCurrency(totalCostUsd, rate),
    displayUserBudget: budgetAmountLkr
      ? `LKR ${Math.round(budgetAmountLkr).toLocaleString()} (approx. ${formatMoney(budgetUsd, "USD")})`
      : null,
  };
}
