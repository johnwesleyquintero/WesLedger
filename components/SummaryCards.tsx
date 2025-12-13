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
      {/* Current Balance */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-2">
           <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider">Net Position</h3>
           <div className="p-2 bg-slate-100 rounded-md text-slate-600 group-hover:bg-slate-200 transition-colors">
             <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
               <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
             </svg>
           </div>
        </div>
        <div className={`text-2xl font-mono font-bold tracking-tight ${metrics.balance >= 0 ? 'text-slate-900' : 'text-red-600'}`}>
          {formatCurrency(metrics.balance, currency, locale)}
        </div>
        <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-900 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      </div>
      
      {/* Total Income */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-2">
           <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider">Inflow</h3>
           <div className="p-2 bg-emerald-50 rounded-md text-emerald-600 group-hover:bg-emerald-100 transition-colors">
             <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
               <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
             </svg>
           </div>
        </div>
        <div className="text-2xl font-mono font-bold text-emerald-600 tracking-tight">
          {formatCurrency(metrics.income, currency, locale)}
        </div>
        <div className="absolute bottom-0 left-0 w-full h-1 bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      </div>

      {/* Total Expenses */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-2">
           <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider">Outflow</h3>
           <div className="p-2 bg-red-50 rounded-md text-red-600 group-hover:bg-red-100 transition-colors">
             <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
               <path strokeLinecap="round" strokeLinejoin="round" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
             </svg>
           </div>
        </div>
        <div className="text-2xl font-mono font-bold text-red-600 tracking-tight">
          {formatCurrency(metrics.expense, currency, locale)}
        </div>
        <div className="absolute bottom-0 left-0 w-full h-1 bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      </div>
    </div>
  );
};