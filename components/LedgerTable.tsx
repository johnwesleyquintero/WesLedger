import React from 'react';
import { LedgerEntry } from '../types';
import { formatCurrency, formatDate } from '../constants';

interface LedgerTableProps {
  entries: LedgerEntry[];
  isLoading: boolean;
}

export const LedgerTable: React.FC<LedgerTableProps> = ({ entries, isLoading }) => {
  if (isLoading && entries.length === 0) {
    return (
      <div className="w-full p-12 text-center text-slate-400">
        Loading ledger data...
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="w-full p-12 text-center text-slate-400 bg-white border border-slate-200 rounded border-dashed">
        No entries found. Start by adding a transaction.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white border border-slate-200 rounded shadow-sm">
      <table className="min-w-full text-sm text-left">
        <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
          <tr>
            <th className="px-6 py-3 w-32">Date</th>
            <th className="px-6 py-3">Description</th>
            <th className="px-6 py-3 w-48">Category</th>
            <th className="px-6 py-3 w-32 text-right">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {entries.map((entry, idx) => (
            <tr key={`${entry.date}-${idx}`} className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-3 font-mono text-slate-600 whitespace-nowrap">
                {formatDate(entry.date)}
              </td>
              <td className="px-6 py-3 text-slate-900 font-medium">
                {entry.description}
              </td>
              <td className="px-6 py-3 text-slate-500">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
                  {entry.category}
                </span>
              </td>
              <td className={`px-6 py-3 text-right font-mono font-bold tabular-nums ${entry.amount < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                {formatCurrency(entry.amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};