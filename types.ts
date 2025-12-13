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
}

export interface MetricSummary {
  balance: number;
  income: number;
  expense: number;
  count: number;
}