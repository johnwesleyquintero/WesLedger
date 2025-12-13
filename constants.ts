export const DEFAULT_CATEGORIES = [
  "Income",
  "Food",
  "Operations",
  "Software/SaaS",
  "Hardware",
  "Shopping",
  "Entertainment",
  "Education",
  "Health",
  "Lifestyle",
  "Transport",
  "Travel",
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

// Visual mapping for categories
export const CATEGORY_COLORS: Record<string, string> = {
  "Income": "bg-emerald-100 text-emerald-800 border-emerald-200",
  "Food": "bg-orange-100 text-orange-800 border-orange-200",
  "Operations": "bg-slate-100 text-slate-700 border-slate-200",
  "Software/SaaS": "bg-indigo-100 text-indigo-700 border-indigo-200",
  "Hardware": "bg-zinc-100 text-zinc-800 border-zinc-300",
  "Shopping": "bg-purple-100 text-purple-800 border-purple-200",
  "Entertainment": "bg-pink-100 text-pink-800 border-pink-200",
  "Education": "bg-sky-100 text-sky-800 border-sky-200",
  "Health": "bg-teal-100 text-teal-800 border-teal-200",
  "Lifestyle": "bg-rose-100 text-rose-800 border-rose-200",
  "Transport": "bg-cyan-100 text-cyan-800 border-cyan-200",
  "Travel": "bg-blue-100 text-blue-800 border-blue-200",
  "Utilities": "bg-amber-100 text-amber-800 border-amber-200",
  "Uncategorized": "bg-gray-100 text-gray-600 border-gray-200"
};

export const getCategoryStyle = (category: string): string => {
  // If explicitly defined, return it
  if (CATEGORY_COLORS[category]) {
    return CATEGORY_COLORS[category];
  }
  // If it's a custom user category, give it a distinct "Custom" look (Indigo/Blueish)
  // rather than the dull gray of "Uncategorized"
  return "bg-indigo-50 text-indigo-700 border-indigo-200";
};

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