import React from 'react';
import { LedgerEntry } from '../types';
import { CashFlowChart } from './analytics/CashFlowChart';
import { ExpenseCategoryList } from './analytics/ExpenseCategoryList';

interface AnalyticsProps {
  entries: LedgerEntry[];
  currency: string;
  locale: string;
}

export const Analytics: React.FC<AnalyticsProps> = ({ entries, currency, locale }) => {
  if (entries.length < 2) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <CashFlowChart entries={entries} />
      <ExpenseCategoryList entries={entries} currency={currency} locale={locale} />
    </div>
  );
};