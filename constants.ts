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

// Formatter for currency
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
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