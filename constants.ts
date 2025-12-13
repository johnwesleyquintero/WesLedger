export const DEFAULT_CATEGORIES = [
  "Income",
  "Operations",
  "Software/SaaS",
  "Hardware",
  "Education",
  "Health",
  "Lifestyle",
  "Transport",
  "Utilities",
  "Uncategorized"
];

export const INITIAL_CONFIG_KEY = 'wesledger_config_v1.5';
export const LOCAL_STORAGE_KEY = 'wesledger_data_v1';
export const DEFAULT_GAS_URL = '';

export const CURRENCY_OPTIONS = [
  { code: 'USD', locale: 'en-US', label: 'USD ($) - United States Dollar' },
  { code: 'PHP', locale: 'en-PH', label: 'PHP (₱) - Philippine Peso' },
  { code: 'EUR', locale: 'de-DE', label: 'EUR (€) - Euro' },
  { code: 'GBP', locale: 'en-GB', label: 'GBP (£) - British Pound' },
  { code: 'JPY', locale: 'ja-JP', label: 'JPY (¥) - Japanese Yen' },
  { code: 'CAD', locale: 'en-CA', label: 'CAD ($) - Canadian Dollar' },
  { code: 'AUD', locale: 'en-AU', label: 'AUD ($) - Australian Dollar' },
  { code: 'SGD', locale: 'en-SG', label: 'SGD ($) - Singapore Dollar' },
];

// Formatter for currency
export const formatCurrency = (amount: number, currency: string = 'USD', locale: string = 'en-US'): string => {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  } catch (e) {
    // Fallback if locale/currency mismatch
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }
};

export const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};