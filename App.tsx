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
import { ConfirmationModal } from './components/ConfirmationModal'; // New Import
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
  
  // --- Modal State ---
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);

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

  // Step 1: User clicks "Clear View" -> Open Modal
  const handleBulkDeleteClick = () => {
    if (filteredEntries.length === 0) return;
    setIsDeleteModalOpen(true);
  };

  // Step 2: User confirms in Modal -> Execute Logic
  const executeBulkDelete = async () => {
    await bulkRemoveTransactions(filteredEntries);
    setIsDeleteModalOpen(false);
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
                   onClick={handleBulkDeleteClick}
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

      {/* Configuration Modal */}
      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)}
        config={config}
        onSave={handleSaveConfig}
      />

      {/* Destructive Action Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={executeBulkDelete}
        title="Clear Current View"
        confirmText="Yes, Delete All"
        isLoading={isLoading}
      >
        <div className="space-y-4">
          <p>
            You are about to permanently delete <strong className="text-red-600">{filteredEntries.length} transactions</strong>. 
            This action cannot be undone.
          </p>
          
          <div className="bg-slate-100 p-3 rounded-md text-xs border border-slate-200">
            <p className="font-semibold text-slate-500 uppercase tracking-wide mb-2">Scope of Deletion:</p>
            <ul className="space-y-1 text-slate-700">
              <li className="flex justify-between">
                <span>Month:</span> 
                <span className="font-mono font-bold">{selectedMonth || 'All Time'}</span>
              </li>
              <li className="flex justify-between">
                <span>Category:</span> 
                <span className="font-mono font-bold">{selectedCategory || 'All Categories'}</span>
              </li>
              {searchQuery && (
                <li className="flex justify-between">
                  <span>Search Term:</span> 
                  <span className="font-mono font-bold">"{searchQuery}"</span>
                </li>
              )}
            </ul>
          </div>
          
          <p className="text-xs text-slate-500 italic">
            Note: This will only remove the entries currently visible in the list below.
          </p>
        </div>
      </ConfirmationModal>

    </div>
  );
};

export default App;