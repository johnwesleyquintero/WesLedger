import React, { useState, useEffect } from 'react';
import { LedgerEntry } from '../types';
import { DEFAULT_CATEGORIES } from '../constants';

interface TransactionFormProps {
  onSubmit: (entry: LedgerEntry) => Promise<void>;
  isSubmitting: boolean;
  initialData?: LedgerEntry | null; // If present, we are in Edit Mode
  onCancelEdit?: () => void;
}

type TransactionType = 'expense' | 'income';

export const TransactionForm: React.FC<TransactionFormProps> = ({ 
  onSubmit, 
  isSubmitting, 
  initialData, 
  onCancelEdit 
}) => {
  
  const [formData, setFormData] = useState<LedgerEntry>({
    id: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: 0,
    category: DEFAULT_CATEGORIES[0],
  });
  
  const [amountStr, setAmountStr] = useState<string>('');
  const [txType, setTxType] = useState<TransactionType>('expense');

  // Populate form if initialData changes (Edit Mode)
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      setAmountStr(Math.abs(initialData.amount).toString());
      setTxType(initialData.amount < 0 ? 'expense' : 'income');
    } else {
      resetForm();
    }
  }, [initialData]);

  const resetForm = () => {
    setFormData({
      id: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
      amount: 0,
      category: DEFAULT_CATEGORIES[0],
    });
    setAmountStr('');
    setTxType('expense'); // Default to expense as it's the most common action
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || !amountStr) return;

    const absVal = Math.abs(parseFloat(amountStr));
    const finalAmount = txType === 'expense' ? -absVal : absVal;
    
    await onSubmit({ ...formData, amount: finalAmount });
    
    if (!initialData) {
      resetForm();
    }
  };

  const isEditing = !!initialData;

  return (
    <form onSubmit={handleSubmit} className={`border p-4 rounded shadow-sm mb-6 transition-colors ${isEditing ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'}`}>
      
      {isEditing && (
        <div className="mb-4 text-xs font-bold text-amber-700 uppercase tracking-wide flex justify-between items-center border-b border-amber-200 pb-2">
          <span>Editing Transaction</span>
          <button type="button" onClick={onCancelEdit} className="text-amber-600 hover:text-amber-900 underline">Cancel</button>
        </div>
      )}

      <div className="flex flex-col gap-4">
        
        {/* Top Row: Type Toggle & Date */}
        <div className="flex gap-4">
          <div className="flex-1">
             <label className="block text-xs font-semibold text-slate-500 mb-1">Type</label>
             <div className="flex bg-slate-100 p-1 rounded">
               <button
                 type="button"
                 onClick={() => setTxType('expense')}
                 className={`flex-1 py-1.5 text-xs font-bold rounded shadow-sm transition-all ${txType === 'expense' ? 'bg-white text-red-600' : 'text-slate-400 hover:text-slate-600'}`}
               >
                 Expense (-)
               </button>
               <button
                 type="button"
                 onClick={() => setTxType('income')}
                 className={`flex-1 py-1.5 text-xs font-bold rounded shadow-sm transition-all ${txType === 'income' ? 'bg-white text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
               >
                 Income (+)
               </button>
             </div>
          </div>
          <div className="flex-[2]">
            <label className="block text-xs font-semibold text-slate-500 mb-1">Date</label>
            <input
              type="date"
              required
              className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500 transition-colors"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>
        </div>

        {/* Bottom Row: Details */}
        <div className="flex flex-col md:flex-row gap-4 items-end">
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
            <label className="block text-xs font-semibold text-slate-500 mb-1">Amount ({txType === 'expense' ? 'Out' : 'In'})</label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                min="0"
                className={`w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500 transition-colors font-mono ${txType === 'expense' ? 'text-red-600' : 'text-emerald-600'}`}
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
              />
            </div>
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
            className={`w-full md:w-auto text-white font-medium px-6 py-2 rounded text-sm disabled:opacity-50 transition-colors shadow-sm ${
              isEditing 
                ? 'bg-amber-600 hover:bg-amber-700' 
                : txType === 'expense' ? 'bg-slate-900 hover:bg-slate-800' : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {isSubmitting ? '...' : isEditing ? 'Update' : 'Record'}
          </button>
        </div>
      </div>
    </form>
  );
};