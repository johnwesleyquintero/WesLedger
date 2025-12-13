import React, { useState } from 'react';
import { LedgerEntry } from '../types';
import { DEFAULT_CATEGORIES } from '../constants';

interface TransactionFormProps {
  onSubmit: (entry: LedgerEntry) => Promise<void>;
  isSubmitting: boolean;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ onSubmit, isSubmitting }) => {
  const [formData, setFormData] = useState<LedgerEntry>({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: 0,
    category: DEFAULT_CATEGORIES[0],
  });
  
  // Local state to handle string input for amount before parsing
  const [amountStr, setAmountStr] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || !amountStr) return;

    // Convert amount to number. If expense (determined by toggle or sign), handle logic?
    // Spec says positive = income, negative = expense. 
    // Let's trust the user to type '-' or provide a simple toggle.
    // Ideally, operator-grade means manual control. Typing "-20" is faster than clicking a toggle.
    
    const val = parseFloat(amountStr);
    
    await onSubmit({ ...formData, amount: val });
    
    // Reset form
    setFormData({
      date: new Date().toISOString().split('T')[0],
      description: '',
      amount: 0,
      category: DEFAULT_CATEGORIES[0],
    });
    setAmountStr('');
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-slate-200 p-4 rounded shadow-sm mb-6">
      <div className="flex flex-col md:flex-row gap-4 items-end">
        
        <div className="flex-1 w-full">
          <label className="block text-xs font-semibold text-slate-500 mb-1">Date</label>
          <input
            type="date"
            required
            className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500 transition-colors"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          />
        </div>

        <div className="flex-[2] w-full">
          <label className="block text-xs font-semibold text-slate-500 mb-1">Description</label>
          <input
            type="text"
            required
            placeholder="Transaction details..."
            className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500 transition-colors"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        <div className="flex-1 w-full">
          <label className="block text-xs font-semibold text-slate-500 mb-1">Amount (+/-)</label>
          <input
            type="number"
            step="0.01"
            required
            placeholder="-0.00"
            className={`w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500 transition-colors font-mono ${parseFloat(amountStr) < 0 ? 'text-red-600' : 'text-slate-900'}`}
            value={amountStr}
            onChange={(e) => setAmountStr(e.target.value)}
          />
        </div>

        <div className="flex-1 w-full">
          <label className="block text-xs font-semibold text-slate-500 mb-1">Category</label>
          <select
            className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500 transition-colors appearance-none"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          >
            {DEFAULT_CATEGORIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full md:w-auto bg-slate-900 text-white font-medium px-6 py-2 rounded text-sm hover:bg-slate-700 disabled:opacity-50 transition-colors"
        >
          {isSubmitting ? '...' : 'Add'}
        </button>
      </div>
    </form>
  );
};