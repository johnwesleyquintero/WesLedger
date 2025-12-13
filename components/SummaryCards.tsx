import React from 'react';
import { MetricSummary } from '../types';
import { formatCurrency } from '../constants';

interface SummaryCardsProps {
  metrics: MetricSummary;
  currency: string;
  locale: string;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ metrics, currency, locale }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="bg-white border border-slate-200 rounded p-5 shadow-sm">
        <h3 className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Current Balance</h3>
        <div className={`text-2xl font-mono font-bold ${metrics.balance >= 0 ? 'text-slate-900' : 'text-red-600'}`}>
          {formatCurrency(metrics.balance, currency, locale)}
        </div>
      </div>
      
      <div className="bg-white border border-slate-200 rounded p-5 shadow-sm">
        <h3 className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Total Income</h3>
        <div className="text-2xl font-mono font-bold text-emerald-600">
          {formatCurrency(metrics.income, currency, locale)}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded p-5 shadow-sm">
        <h3 className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Total Expenses</h3>
        <div className="text-2xl font-mono font-bold text-red-600">
          {formatCurrency(metrics.expense, currency, locale)}
        </div>
      </div>
    </div>
  );
};