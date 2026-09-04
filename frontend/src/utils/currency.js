// USD to INR conversion utility for Multimodal V3 UI presentation
// The underlying ML model strictly predicts in USD (Airbnb rental price in Asheville, NC).
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

export const getInrPrice = (item, field = 'predicted_rent') => {
  if (item === null || item === undefined) return 0;
  if (typeof item === 'number' || typeof item === 'string') {
    return usdToInr(item);
  }
  if (field === 'predicted_rent' && item.predicted_price_inr) {
    return Number(item.predicted_price_inr);
  }
  if (field === 'lower_bound' && (item.lower_bound_inr || item.prediction_interval?.lower_bound_inr)) {
    return Number(item.lower_bound_inr || item.prediction_interval.lower_bound_inr);
  }
  if (field === 'upper_bound' && (item.upper_bound_inr || item.prediction_interval?.upper_bound_inr)) {
    return Number(item.upper_bound_inr || item.prediction_interval.upper_bound_inr);
  }
  const rawVal = item[field] ?? item.predicted_price_usd ?? item.predictedRent ?? 0;
  return usdToInr(rawVal);
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
