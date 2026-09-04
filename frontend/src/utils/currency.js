// USD to INR conversion utility for Multimodal V3 UI presentation
// The underlying ML model strictly predicts in USD (Airbnb nightly price in Asheville, NC).
// This utility handles client-side currency display conversion to Indian Rupees (INR / ₹).

export const USD_TO_INR_RATE = Number(import.meta.env.VITE_USD_TO_INR_RATE) || 83.5;

/**
 * Converts a USD value to INR using the configured exchange rate
 * @param {number|string} usdAmount - Amount in USD
 * @returns {number} Amount in INR rounded to nearest integer
 */
export const usdToInr = (usdAmount) => {
  if (usdAmount === null || usdAmount === undefined || isNaN(Number(usdAmount))) {
    return 0;
  }
  return Math.round(Number(usdAmount) * USD_TO_INR_RATE);
};

/**
 * Formats an amount in INR with ₹ symbol and Indian numbering system (en-IN)
 * @param {number|string} inrAmount - Amount in INR
 * @returns {string} Formatted string, e.g., "₹16,285"
 */
export const formatInr = (inrAmount) => {
  if (inrAmount === null || inrAmount === undefined || isNaN(Number(inrAmount))) {
    return '₹0';
  }
  return `₹${Math.round(Number(inrAmount)).toLocaleString('en-IN')}`;
};

/**
 * Converts USD amount and formats as INR string
 * @param {number|string} usdAmount - Amount in USD
 * @returns {string} Formatted string in INR, e.g., "₹16,285"
 */
export const formatUsdAsInr = (usdAmount) => {
  return formatInr(usdToInr(usdAmount));
};
