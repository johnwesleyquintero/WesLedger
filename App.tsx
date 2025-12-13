import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { LedgerEntry, AppConfig, MetricSummary, Notification } from './types';
import { INITIAL_CONFIG_KEY, DEFAULT_GAS_URL } from './constants';
import { SummaryCards } from './components/SummaryCards';
import { LedgerTable } from './components/LedgerTable';
import { TransactionForm } from './components/TransactionForm';
import { SettingsModal } from './components/SettingsModal';
import { FilterBar } from './components/FilterBar';
import { ToastContainer } from './components/Toast';
import { Analytics } from './components/Analytics';
import { useLedger } from './hooks/useLedger';
import { generateAndDownloadCSV } from './utils/exportUtils';

const App: React.FC = () => {
  // --- Global UI State ---
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [editingEntry, setEditingEntry] = useState<LedgerEntry | null>(null);

  // --- Filter State ---
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>(() => new Date().toISOString().slice(0, 7));

  // --- Config State ---
  const [config, setConfig] = useState<AppConfig>(() => {
    const saved = localStorage.getItem(INITIAL_CONFIG_KEY);
    const defaultConfig: AppConfig = { 
      mode: 'LIVE', 
      gasDeploymentUrl: DEFAULT_GAS_URL, 
      apiToken: '',
      currency: 'USD',
      locale: 'en-US'
    };
    if (saved) return { ...defaultConfig, ...JSON.parse(saved) };
    return defaultConfig;
  });

  useEffect(() => {
    localStorage.setItem(INITIAL_CONFIG_KEY, JSON.stringify(config));
  }, [config]);

  // --- Notification System ---
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, message, type }]);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // --- Business Logic Hook ---
  const { 
    entries, 
    isLoading, 
    isSubmitting, 
    saveTransaction, 
    removeTransaction, 
    bulkRemoveTransactions 
  } = useLedger(config, showToast);

  // --- Event Handlers ---

  const handleFormSubmit = async (entry: LedgerEntry) => {
    const success = await saveTransaction(entry, !!editingEntry);
    if (success && editingEntry) {
      setEditingEntry(null);
    }
  };

  const handleEditClick = (entry: LedgerEntry) => {
    if (!entry.id) {
      showToast("Legacy entry lacks ID. Cannot edit.", 'error');
      return;
    }
    setEditingEntry(entry);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClick = async (entry: LedgerEntry) => {
    if (window.confirm(`Are you sure you want to delete "${entry.description}"?`)) {
      await removeTransaction(entry);
    }
  };

  const handleBulkDelete = async () => {
    const count = filteredEntries.length;
    if (count === 0) return;

    const confirmed = window.confirm(
      `⚠️ CRITICAL WARNING ⚠️\n\nYou are about to PERMANENTLY DELETE ${count} entries from your ledger.\n\nThis applies to the currently filtered view (Search: "${searchQuery}", Category: "${selectedCategory}", Month: "${selectedMonth}").\nThis action CANNOT be undone.\n\nAre you sure you want to proceed?`
    );

    if (confirmed) {
      await bulkRemoveTransactions(filteredEntries);
    }
  };

  const handleSaveConfig = (newConfig: AppConfig) => {
    setConfig(newConfig);
    setShowSettings(false);
    showToast('Configuration saved', 'success');
  };

  const handleExportCSV = () => {
    const success = generateAndDownloadCSV(filteredEntries);
    if (success) {
      showToast('Export generated', 'success');
    } else {
      showToast('No data to export', 'info');
    }
  };

  // --- Derived Data ---

  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      const matchesSearch = entry.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory ? entry.category === selectedCategory : true;
      let matchesMonth = true;
      if (selectedMonth) {
        matchesMonth = entry.date.startsWith(selectedMonth);
      }
      return matchesSearch && matchesCategory && matchesMonth;
    });
  }, [entries, searchQuery, selectedCategory, selectedMonth]);

  const metrics: MetricSummary = useMemo(() => {
    return filteredEntries.reduce((acc, curr) => {
      const amount = Number(curr.amount);
      return {
        balance: acc.balance + amount,
        income: amount > 0 ? acc.income + amount : acc.income,
        expense: amount < 0 ? acc.expense + amount : acc.expense,
        count: acc.count + 1
      };
    }, { balance: 0, income: 0, expense: 0, count: 0 });
  }, [filteredEntries]);

  // --- Render ---

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20">
      
      <ToastContainer notifications={notifications} removeNotification={removeNotification} />

      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm backdrop-blur-md bg-white/90">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-9 h-9 bg-slate-900 text-white flex items-center justify-center rounded-lg font-bold font-mono text-xl shadow-lg shadow-slate-900/20">
               W
             </div>
             <div>
               <h1 className="text-xl font-bold tracking-tight text-slate-900">WesLedger</h1>
               <div className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold flex items-center gap-2">
                  System v1.7
                  <span className={`w-2 h-2 rounded-full ${config.mode === 'LIVE' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-amber-400'}`}></span>
               </div>
             </div>
          </div>
          
          <button 
            onClick={() => setShowSettings(true)}
            className="text-slate-600 hover:text-slate-900 text-sm font-medium flex items-center gap-2 px-3 py-2 rounded-md hover:bg-slate-50 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
              <path d="M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 0 1-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311c.446.82.023 1.841-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 0 1 .872 2.105l.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 0 1 2.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 0 1 2.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 0 1 .872-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 0 1-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 0 1-2.105-.872l-.1-.34zM8 10.93a2.929 2.929 0 1 1 0-5.86 2.929 2.929 0 0 1 0 5.858z"/>
            </svg>
            Config
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <SummaryCards 
          metrics={metrics} 
          currency={config.currency} 
          locale={config.locale} 
        />
        
        <Analytics 
          entries={filteredEntries} 
          currency={config.currency} 
          locale={config.locale} 
        />

        <TransactionForm 
          onSubmit={handleFormSubmit} 
          isSubmitting={isSubmitting} 
          initialData={editingEntry}
          onCancelEdit={() => setEditingEntry(null)}
        />

        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
             <div className="flex items-baseline gap-3">
               <h2 className="text-xl font-bold text-slate-800 tracking-tight">Ledger Entries</h2>
               <span className="text-sm text-slate-400 font-mono">
                 {filteredEntries.length} Records
               </span>
             </div>
             
             {filteredEntries.length > 0 && (
               <div className="flex gap-2">
                 <button 
                   onClick={handleBulkDelete}
                   className="text-sm font-semibold text-red-600 hover:text-red-700 flex items-center gap-2 transition-colors border border-red-200 px-3 py-1.5 rounded bg-white shadow-sm hover:bg-red-50"
                 >
                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                     <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                     <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                   </svg>
                   Clear View
                 </button>
                 <button 
                   onClick={handleExportCSV}
                   className="text-sm font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-2 transition-colors border border-slate-200 px-3 py-1.5 rounded bg-white shadow-sm hover:shadow"
                 >
                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                     <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                     <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
                   </svg>
                   Export CSV
                 </button>
               </div>
              )}
           </div>
           
           <FilterBar 
             searchQuery={searchQuery}
             setSearchQuery={setSearchQuery}
             selectedCategory={selectedCategory}
             setSelectedCategory={setSelectedCategory}
             selectedMonth={selectedMonth}
             setSelectedMonth={setSelectedMonth}
           />

           <LedgerTable 
             entries={filteredEntries} 
             isLoading={isLoading} 
             onEdit={handleEditClick}
             onDelete={handleDeleteClick}
             currency={config.currency}
             locale={config.locale}
           />
        </div>

      </main>

      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)}
        config={config}
        onSave={handleSaveConfig}
      />
    </div>
  );
};

export default App;