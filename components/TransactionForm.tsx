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
    category: DEFAULT_CATEGORIES[1], // Default to 'Food' (index 1) or similar
  });
  
  const [amountStr, setAmountStr] = useState<string>('');
  const [txType, setTxType] = useState<TransactionType>('expense');
  const [isCustomCategory, setIsCustomCategory] = useState<boolean>(false);

  // Populate form if initialData changes (Edit Mode)
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      setAmountStr(Math.abs(initialData.amount).toString());
      setTxType(initialData.amount < 0 ? 'expense' : 'income');
      
      // Check if the existing category is in our default list. If not, switch to custom mode.
      const isStandard = DEFAULT_CATEGORIES.includes(initialData.category);
      setIsCustomCategory(!isStandard);
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
      category: DEFAULT_CATEGORIES[1],
    });
    setAmountStr('');
    setTxType('expense'); // Default to expense
    setIsCustomCategory(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || !amountStr || !formData.category) return;

    const absVal = Math.abs(parseFloat(amountStr));
    const finalAmount = txType === 'expense' ? -absVal : absVal;
    
    await onSubmit({ ...formData, amount: finalAmount });
    
    if (!initialData) {
      resetForm();
    }
  };

  const toggleCategoryMode = () => {
    setIsCustomCategory(!isCustomCategory);
    // When switching back to dropdown, reset to default if current value isn't in list
    if (isCustomCategory) {
       setFormData(prev => ({ ...prev, category: DEFAULT_CATEGORIES[1] }));
    } else {
       // When switching to custom, clear it so they can type
       setFormData(prev => ({ ...prev, category: '' }));
    }
  };

  const isEditing = !!initialData;
  const isExpense = txType === 'expense';

  // Dynamic Theme Colors
  const theme = {
    bg: isExpense ? 'bg-white' : 'bg-white',
    border: isExpense ? 'border-rose-100' : 'border-emerald-100',
    accentBg: isExpense ? 'bg-rose-50' : 'bg-emerald-50',
    accentText: isExpense ? 'text-rose-600' : 'text-emerald-600',
    ring: isExpense ? 'focus:ring-rose-500/20' : 'focus:ring-emerald-500/20',
    btn: isExpense ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700',
    inputBorder: isExpense ? 'focus:border-rose-500' : 'focus:border-emerald-500',
    iconColor: isExpense ? 'text-rose-500' : 'text-emerald-500',
    shadow: isExpense ? 'shadow-[0_4px_20px_-4px_rgba(225,29,72,0.1)]' : 'shadow-[0_4px_20px_-4px_rgba(16,185,129,0.1)]'
  };

  if (isEditing) {
    theme.border = 'border-amber-200';
    theme.bg = 'bg-amber-50';
    theme.shadow = 'shadow-md';
  }

  return (
    <form 
      onSubmit={handleSubmit} 
      className={`relative border rounded-xl p-5 mb-6 transition-all duration-300 ${theme.bg} ${theme.border} ${theme.shadow}`}
    >
      
      {isEditing && (
        <div className="mb-4 text-xs font-bold text-amber-700 uppercase tracking-wide flex justify-between items-center border-b border-amber-200 pb-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            <span>Editing Transaction</span>
          </div>
          <button type="button" onClick={onCancelEdit} className="text-amber-600 hover:text-amber-900 text-[10px] bg-white px-2 py-1 rounded border border-amber-200">Cancel</button>
        </div>
      )}

      <div className="flex flex-col gap-5">
        
        {/* Top Row: Type Toggle & Date */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
             <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Type</label>
             <div className="flex bg-slate-100 p-1 rounded-lg">
               <button
                 type="button"
                 onClick={() => setTxType('expense')}
                 className={`flex-1 py-2 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-2 ${txType === 'expense' ? 'bg-white text-rose-600 shadow-sm ring-1 ring-black/5' : 'text-slate-400 hover:text-slate-600'}`}
               >
                 Expense
               </button>
               <button
                 type="button"
                 onClick={() => setTxType('income')}
                 className={`flex-1 py-2 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-2 ${txType === 'income' ? 'bg-white text-emerald-600 shadow-sm ring-1 ring-black/5' : 'text-slate-400 hover:text-slate-600'}`}
               >
                 Income
               </button>
             </div>
          </div>
          <div className="flex-[2]">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Date</label>
            <input
              type="date"
              required
              className={`w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-4 transition-all shadow-sm text-slate-700 ${theme.inputBorder} ${theme.ring}`}
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>
        </div>

        {/* Bottom Row: Details */}
        <div className="flex flex-col lg:flex-row gap-4 items-end">
          <div className="flex-[2] w-full">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Description</label>
            <input
              type="text"
              required
              placeholder="e.g. Server Costs, Lunch, Groceries..."
              className={`w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-4 transition-all shadow-sm text-slate-700 placeholder-slate-400 ${theme.inputBorder} ${theme.ring}`}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="flex-1 w-full">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Amount</label>
            <div className="relative">
              <span className={`absolute left-3 top-2 text-sm font-bold ${theme.iconColor}`}>
                {isExpense ? '-' : '+'}
              </span>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                min="0"
                className={`w-full bg-slate-50 border border-slate-200 rounded-lg pl-6 pr-3 py-2 text-sm focus:outline-none focus:ring-4 transition-all shadow-sm font-mono font-bold ${theme.inputBorder} ${theme.ring} ${theme.accentText}`}
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 w-full">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex justify-between">
                Category
                <button 
                    type="button" 
                    onClick={toggleCategoryMode}
                    className="text-[9px] underline text-slate-400 hover:text-slate-600"
                >
                    {isCustomCategory ? 'Use List' : 'Custom?'}
                </button>
            </label>
            
            {isCustomCategory ? (
                 <div className="relative">
                     <input
                         type="text"
                         required
                         placeholder="Type category..."
                         className={`w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-4 transition-all shadow-sm text-slate-700 ${theme.inputBorder} ${theme.ring}`}
                         value={formData.category}
                         onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                     />
                 </div>
            ) : (
                <div className="relative">
                    <select
                        className={`w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-4 transition-all shadow-sm appearance-none text-slate-700 ${theme.inputBorder} ${theme.ring}`}
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                    {DEFAULT_CATEGORIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full lg:w-auto h-[38px] text-white font-bold tracking-wide uppercase px-6 rounded-lg text-xs disabled:opacity-50 transition-all shadow-md hover:shadow-lg active:scale-95 ${
              isEditing 
                ? 'bg-amber-600 hover:bg-amber-700' 
                : theme.btn
            }`}
          >
            {isSubmitting ? '...' : isEditing ? 'Update' : 'Record'}
          </button>
        </div>
      </div>
    </form>
  );
};