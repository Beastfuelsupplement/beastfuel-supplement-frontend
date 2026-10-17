import { useState, useEffect } from 'react';

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  country: string;
  defaultTimezone: string;
  decimals: number;
  symbolPosition: 'prefix' | 'suffix';
  spaceAfterSymbol?: boolean;
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyConfig> = {
  LKR: {
    code: 'LKR',
    symbol: 'Rs.',
    name: 'Sri Lankan Rupee',
    country: 'Sri Lanka',
    defaultTimezone: 'Asia/Colombo',
    decimals: 2,
    symbolPosition: 'prefix',
    spaceAfterSymbol: true, // e.g. "Rs. 12,000.00"
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    country: 'United States',
    defaultTimezone: 'America/New_York',
    decimals: 2,
    symbolPosition: 'prefix',
    spaceAfterSymbol: false, // e.g. "$120.00"
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    country: 'European Union (Eurozone)',
    defaultTimezone: 'Europe/Paris',
    decimals: 2,
    symbolPosition: 'prefix',
    spaceAfterSymbol: false, // e.g. "€120.00"
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    country: 'United Kingdom',
    defaultTimezone: 'Europe/London',
    decimals: 2,
    symbolPosition: 'prefix',
    spaceAfterSymbol: false, // e.g. "£120.00"
  },
  AUD: {
    code: 'AUD',
    symbol: 'A$',
    name: 'Australian Dollar',
    country: 'Australia',
    defaultTimezone: 'Australia/Sydney',
    decimals: 2,
    symbolPosition: 'prefix',
    spaceAfterSymbol: false,
  },
  CAD: {
    code: 'CAD',
    symbol: 'C$',
    name: 'Canadian Dollar',
    country: 'Canada',
    defaultTimezone: 'America/Toronto',
    decimals: 2,
    symbolPosition: 'prefix',
    spaceAfterSymbol: false,
  },
  INR: {
    code: 'INR',
    symbol: '₹',
    name: 'Indian Rupee',
    country: 'India',
    defaultTimezone: 'Asia/Kolkata',
    decimals: 2,
    symbolPosition: 'prefix',
    spaceAfterSymbol: false,
  },
  AED: {
    code: 'AED',
    symbol: 'AED',
    name: 'UAE Dirham',
    country: 'United Arab Emirates',
    defaultTimezone: 'Asia/Dubai',
    decimals: 2,
    symbolPosition: 'prefix',
    spaceAfterSymbol: true,
  },
};

// Map Countries to their default Currency & Timezone
export const COUNTRY_DEFAULTS: Record<string, { currency: string; timezone: string }> = {
  'Sri Lanka': { currency: 'LKR', timezone: 'Asia/Colombo' },
  'United States': { currency: 'USD', timezone: 'America/New_York' },
  'United Kingdom': { currency: 'GBP', timezone: 'Europe/London' },
  'European Union': { currency: 'EUR', timezone: 'Europe/Paris' },
  'Germany': { currency: 'EUR', timezone: 'Europe/Berlin' },
  'France': { currency: 'EUR', timezone: 'Europe/Paris' },
  'Australia': { currency: 'AUD', timezone: 'Australia/Sydney' },
  'Canada': { currency: 'CAD', timezone: 'America/Toronto' },
  'India': { currency: 'INR', timezone: 'Asia/Kolkata' },
  'United Arab Emirates': { currency: 'AED', timezone: 'Asia/Dubai' },
  'Singapore': { currency: 'USD', timezone: 'Asia/Singapore' },
  'Japan': { currency: 'USD', timezone: 'Asia/Tokyo' },
};

// Comprehensive Timezones List grouped by region
export const TIMEZONE_OPTIONS = [
  { value: 'Asia/Colombo', label: 'Sri Lanka (Colombo) - UTC+05:30', country: 'Sri Lanka' },
  { value: 'Asia/Kolkata', label: 'India (IST) - UTC+05:30', country: 'India' },
  { value: 'Asia/Dubai', label: 'United Arab Emirates (Dubai) - UTC+04:00', country: 'United Arab Emirates' },
  { value: 'Asia/Singapore', label: 'Singapore - UTC+08:00', country: 'Singapore' },
  { value: 'Asia/Tokyo', label: 'Japan (Tokyo) - UTC+09:00', country: 'Japan' },
  { value: 'America/New_York', label: 'United States (Eastern Time) - UTC-05:00', country: 'United States' },
  { value: 'America/Chicago', label: 'United States (Central Time) - UTC-06:00', country: 'United States' },
  { value: 'America/Denver', label: 'United States (Mountain Time) - UTC-07:00', country: 'United States' },
  { value: 'America/Los_Angeles', label: 'United States (Pacific Time) - UTC-08:00', country: 'United States' },
  { value: 'America/Toronto', label: 'Canada (Eastern) - UTC-05:00', country: 'Canada' },
  { value: 'America/Vancouver', label: 'Canada (Pacific) - UTC-08:00', country: 'Canada' },
  { value: 'Europe/London', label: 'United Kingdom (London - GMT/BST) - UTC+00:00', country: 'United Kingdom' },
  { value: 'Europe/Paris', label: 'Europe (Paris/Berlin - CET) - UTC+01:00', country: 'European Union' },
  { value: 'Europe/Berlin', label: 'Germany (Berlin - CET) - UTC+01:00', country: 'Germany' },
  { value: 'Australia/Sydney', label: 'Australia (Sydney - AEST) - UTC+10:00', country: 'Australia' },
  { value: 'Australia/Perth', label: 'Australia (Perth - AWST) - UTC+08:00', country: 'Australia' },
];

/**
 * Get the currently active currency code from local storage/cache
 */
export function getActiveCurrencyCode(): string {
  try {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('beastfuel_site_settings');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.currency) return parsed.currency.toUpperCase();
      }
      const direct = localStorage.getItem('beastfuel_currency');
      if (direct) return direct.toUpperCase();
    }
  } catch {
    // ignore
  }
  return 'LKR';
}

/**
 * Get symbol for a given currency code (default: active currency)
 */
export function getCurrencySymbol(code?: string): string {
  const c = (code || getActiveCurrencyCode()).toUpperCase();
  const config = SUPPORTED_CURRENCIES[c];
  return config ? config.symbol : c;
}

/**
 * Format a number as currency using the active store currency
 * (e.g. $120.00, €120.00, £120.00, Rs. 12,000.00)
 */
export const formatCurrency = (
  amount: number | string,
  decimals: number = 2,
  overrideCurrency?: string
): string => {
  const num = Number(amount) || 0;
  const currencyCode = (overrideCurrency || getActiveCurrencyCode()).toUpperCase();
  const config = SUPPORTED_CURRENCIES[currencyCode] || {
    code: currencyCode,
    symbol: currencyCode,
    decimals: 2,
    symbolPosition: 'prefix',
    spaceAfterSymbol: true,
  };

  const formattedNum = num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  const space = config.spaceAfterSymbol ? ' ' : '';

  if (config.symbolPosition === 'suffix') {
    return `${formattedNum} ${config.symbol}`;
  }

  return `${config.symbol}${space}${formattedNum}`;
};

/**
 * Format currency for compact display (e.g. whole number + decimal split)
 */
export const formatCurrencyParts = (
  amount: number | string,
  overrideCurrency?: string
): { symbol: string; whole: string; decimal: string; full: string } => {
  const num = Number(amount) || 0;
  const currencyCode = (overrideCurrency || getActiveCurrencyCode()).toUpperCase();
  const config = SUPPORTED_CURRENCIES[currencyCode] || SUPPORTED_CURRENCIES.LKR;
  const space = config.spaceAfterSymbol ? ' ' : '';
  const wholePart = Math.floor(num).toLocaleString('en-US');
  const decimalPart = `.${(num % 1).toFixed(2).slice(2)}`;

  return {
    symbol: config.symbol,
    whole: `${config.symbol}${space}${wholePart}`,
    decimal: decimalPart,
    full: `${config.symbol}${space}${wholePart}${decimalPart}`,
  };
};

/**
 * Dynamic getter for CURRENCY_SYMBOL so legacy calls get the active symbol
 */
export const CURRENCY_SYMBOL = {
  toString: () => getCurrencySymbol(),
  valueOf: () => getCurrencySymbol(),
};

export const SHIPPING_COST = 9.99;
export const FREE_SHIPPING_THRESHOLD = 50;

/**
 * React Hook: provides reactive currency & timezone values that update automatically
 * whenever settings are changed in the admin dashboard!
 */
export function useCurrency() {
  const [currency, setCurrency] = useState<string>(getActiveCurrencyCode());

  useEffect(() => {
    const handleUpdate = (e: any) => {
      const newCurrency = e?.detail?.currency || getActiveCurrencyCode();
      setCurrency(newCurrency.toUpperCase());
    };

    window.addEventListener('settings:updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('settings:updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const config = SUPPORTED_CURRENCIES[currency] || SUPPORTED_CURRENCIES.LKR;

  return {
    currency,
    currencySymbol: config.symbol,
    config,
    formatCurrency: (amount: number | string, decimals: number = 2) =>
      formatCurrency(amount, decimals, currency),
    formatCurrencyParts: (amount: number | string) =>
      formatCurrencyParts(amount, currency),
  };
}
