export interface LedgerEntry {
  id: string;         // UUID for row identification
  date: string;       // YYYY-MM-DD
  description: string;
  amount: number;     // Positive = Income, Negative = Expense
  category: string;
  createdAt?: string; // ISO Timestamp
}

export interface LedgerState {
  entries: LedgerEntry[];
  isLoading: boolean;
  error: string | null;
  config: AppConfig;
}

export interface AppConfig {
  mode: 'DEMO' | 'LIVE';
  gasDeploymentUrl: string;
  apiToken: string; // The Shared Secret
  currency: string; // e.g. 'USD', 'PHP'
  locale: string;   // e.g. 'en-US', 'en-PH'
}

export interface MetricSummary {
  balance: number;
  income: number;
  expense: number;
  count: number;
}

export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}