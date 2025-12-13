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

export const INITIAL_CONFIG_KEY = 'wesledger_config_v1.3';
export const LOCAL_STORAGE_KEY = 'wesledger_data_v1';
export const DEFAULT_GAS_URL = 'https://script.google.com/macros/s/AKfycbzVjOP7Z1rp2RI1GWnQF1_iraY_BFms5BY55TJM6pfzG4O1OQgKzqrQkUPM6PQ4nW_s/exec';

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