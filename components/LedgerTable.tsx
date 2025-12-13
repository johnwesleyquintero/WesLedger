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

const TableSkeleton = () => (
  <tbody className="divide-y divide-slate-100 animate-pulse">
    {[...Array(5)].map((_, i) => (
      <tr key={i}>
        <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-24"></div></td>
        <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-48 mb-2"></div><div className="h-3 bg-slate-100 rounded w-16 sm:hidden"></div></td>
        <td className="hidden sm:table-cell px-6 py-4"><div className="h-6 bg-slate-100 rounded-full w-24"></div></td>
        <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-20 ml-auto"></div></td>
        <td className="px-6 py-4"><div className="h-8 bg-slate-100 rounded-full w-16 ml-auto"></div></td>
      </tr>
    ))}
  </tbody>
);

export const LedgerTable: React.FC<LedgerTableProps> = ({ entries, isLoading, onEdit, onDelete, currency, locale }) => {
  
  if (!isLoading && entries.length === 0) {
    return (
      <div className="w-full p-12 text-center bg-white border border-slate-200 rounded-lg border-dashed">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-slate-500 font-medium">No entries found.</p>
        <p className="text-slate-400 text-sm mt-1">Adjust filters or add a new transaction.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden bg-white border border-slate-200 rounded-lg shadow-sm">
      <div className="overflow-x-auto max-h-[600px] overflow-y-auto custom-scrollbar">
        <table className="min-w-full text-sm text-left relative border-collapse">
          <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="px-4 sm:px-6 py-3 w-24 sm:w-32 whitespace-nowrap bg-slate-50">Date</th>
              <th className="px-4 sm:px-6 py-3 min-w-[140px] bg-slate-50">Description</th>
              <th className="hidden sm:table-cell px-6 py-3 w-48 bg-slate-50">Category</th>
              <th className="px-4 sm:px-6 py-3 w-28 sm:w-32 text-right bg-slate-50">Amount</th>
              <th className="px-4 sm:px-6 py-3 w-20 text-right bg-slate-50">Actions</th>
            </tr>
          </thead>
          
          {isLoading ? (
            <TableSkeleton />
          ) : (
            <tbody className="divide-y divide-slate-100">
              {entries.map((entry, idx) => (
                <tr key={entry.id || `row-${idx}`} className="group hover:bg-slate-50 transition-colors">
                  <td className="px-4 sm:px-6 py-3 font-mono text-slate-600 whitespace-nowrap text-xs sm:text-sm">
                    <span className="hidden sm:inline">{formatDate(entry.date)}</span>
                    <span className="sm:hidden">{entry.date.slice(5)}</span> {/* MM-DD on mobile */}
                  </td>
                  <td className="px-4 sm:px-6 py-3 text-slate-900 font-medium align-top sm:align-middle">
                    <div className="line-clamp-2">{entry.description}</div>
                    {/* Mobile-only category pill under description */}
                    <div className="sm:hidden mt-1">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                        {entry.category}
                      </span>
                    </div>
                  </td>
                  <td className="hidden sm:table-cell px-6 py-3 text-slate-500">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                      {entry.category}
                    </span>
                  </td>
                  <td className={`px-4 sm:px-6 py-3 text-right font-mono font-bold tabular-nums whitespace-nowrap ${entry.amount < 0 ? 'text-slate-900' : 'text-emerald-600'}`}>
                    {entry.amount < 0 ? (
                      <span>{formatCurrency(entry.amount, currency, locale)}</span>
                    ) : (
                      <span className="flex items-center justify-end gap-1">
                        {formatCurrency(entry.amount, currency, locale)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 sm:px-6 py-3 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => onEdit(entry)}
                        className="text-slate-400 hover:text-indigo-600 p-1.5 rounded-md hover:bg-indigo-50 transition-colors"
                        title="Edit"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => onDelete(entry)}
                        className="text-slate-400 hover:text-red-600 p-1.5 rounded-md hover:bg-red-50 transition-colors"
                        title="Delete"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          )}
        </table>
      </div>
    </div>
  );
};