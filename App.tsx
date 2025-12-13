import React, { useState, useMemo } from 'react';
import { LedgerEntry, AppConfig } from './types';
import { SummaryCards } from './components/SummaryCards';
import { LedgerTable } from './components/LedgerTable';
import { TransactionForm } from './components/TransactionForm';
import { SettingsModal } from './components/SettingsModal';
import { FilterBar } from './components/FilterBar';
import { ToastContainer } from './components/Toast';
import { Analytics } from './components/Analytics';
import { Header } from './components/Header';
import { useLedger } from './hooks/useLedger';
import { useLedgerAnalytics } from './hooks/useLedgerAnalytics';
import { useAppConfig } from './hooks/useAppConfig';
import { useNotifications } from './hooks/useNotifications';
import { generateAndDownloadCSV } from './utils/exportUtils';
import { DEFAULT_CATEGORIES } from './constants';

const App: React.FC = () => {
  // --- Infrastructure Hooks ---
  const { config, setConfig } = useAppConfig();
  const { notifications, showToast, removeNotification } = useNotifications();

  // --- Local UI State ---
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [editingEntry, setEditingEntry] = useState<LedgerEntry | null>(null);

  // --- Filter State ---
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>(() => new Date().toISOString().slice(0, 7));

  // --- Business Logic Hooks ---
  const { 
    entries, 
    isLoading, 
    isSubmitting, 
    saveTransaction, 
    removeTransaction, 
    bulkRemoveTransactions 
  } = useLedger(config, showToast);

  const { filteredEntries, metrics } = useLedgerAnalytics({
    entries,
    searchQuery,
    selectedCategory,
    selectedMonth
  });

  // --- Dynamic Categories for Filter ---
  // Combine defaults with any custom categories found in the entries
  const availableCategories = useMemo(() => {
    const customCategories = entries.map(e => e.category).filter(c => !DEFAULT_CATEGORIES.includes(c));
    const uniqueCustom = Array.from(new Set(customCategories));
    return [...DEFAULT_CATEGORIES, ...uniqueCustom];
  }, [entries]);

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

  // --- Render ---

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20">
      
      <ToastContainer notifications={notifications} removeNotification={removeNotification} />

      <Header config={config} onOpenSettings={() => setShowSettings(true)} />

      <main className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-6">
        
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
             <div className="flex items-baseline gap-3">
               <h2 className="text-xl font-bold text-slate-800 tracking-tight">Ledger Entries</h2>
               <span className="text-sm text-slate-400 font-mono">
                 {filteredEntries.length} Records
               </span>
             </div>
             
             {filteredEntries.length > 0 && (
               <div className="flex gap-2 w-full sm:w-auto">
                 <button 
                   onClick={handleBulkDelete}
                   className="flex-1 sm:flex-none justify-center text-sm font-semibold text-red-600 hover:text-red-700 flex items-center gap-2 transition-colors border border-red-200 px-3 py-1.5 rounded bg-white shadow-sm hover:bg-red-50"
                 >
                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                     <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                     <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                   </svg>
                   <span className="hidden sm:inline">Clear View</span>
                   <span className="sm:hidden">Clear</span>
                 </button>
                 <button 
                   onClick={handleExportCSV}
                   className="flex-1 sm:flex-none justify-center text-sm font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-2 transition-colors border border-slate-200 px-3 py-1.5 rounded bg-white shadow-sm hover:shadow"
                 >
                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                     <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                     <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
                   </svg>
                   <span className="hidden sm:inline">Export CSV</span>
                   <span className="sm:hidden">Export</span>
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
             availableCategories={availableCategories}
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