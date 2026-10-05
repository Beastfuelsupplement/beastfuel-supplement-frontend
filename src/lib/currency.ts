/**
 * Format a number as currency with Rs. prefix
 */
export const formatCurrency = (amount: number, decimals: number = 2): string => {
  return `Rs. ${amount.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
};

/**
 * Format currency for compact display (whole number + decimal split)
 */
export const formatCurrencyParts = (amount: number): { whole: string; decimal: string } => {
  return {
    whole: `Rs. ${Math.floor(amount).toLocaleString('en-US')}`,
    decimal: `.${(amount % 1).toFixed(2).slice(2)}`,
  };
};

export const CURRENCY_SYMBOL = 'Rs.';
export const SHIPPING_COST = 9.99;
export const FREE_SHIPPING_THRESHOLD = 50;
