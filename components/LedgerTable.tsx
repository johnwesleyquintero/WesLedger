import React from 'react';
import { LedgerEntry } from '../types';
import { formatCurrency, formatDate } from '../constants';

interface LedgerTableProps {
  entries: LedgerEntry[];
  isLoading: boolean;
  onEdit: (entry: LedgerEntry) => void;
  onDelete: (entry: LedgerEntry) => void;
  currency: string;
  locale: string;
}

export const LedgerTable: React.FC<LedgerTableProps> = ({ entries, isLoading, onEdit, onDelete, currency, locale }) => {
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
            <th className="px-6 py-3 w-20 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {entries.map((entry, idx) => (
            <tr key={entry.id || `row-${idx}`} className="group hover:bg-slate-50 transition-colors">
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
                {formatCurrency(entry.amount, currency, locale)}
              </td>
              <td className="px-6 py-3 text-right">
                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => onEdit(entry)}
                    className="text-slate-400 hover:text-indigo-600 p-1"
                    title="Edit"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708l-3-3zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207l6.5-6.5zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.499.499 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11l.178-.178z"/>
                    </svg>
                  </button>
                  <button 
                    onClick={() => onDelete(entry)}
                    className="text-slate-400 hover:text-red-600 p-1"
                    title="Delete"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                      <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};