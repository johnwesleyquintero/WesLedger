import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { LedgerEntry, AppConfig, MetricSummary, Notification } from './types';
import { fetchEntries, addEntry, updateEntry, deleteEntry } from './services/ledgerService';
import { INITIAL_CONFIG_KEY, DEFAULT_GAS_URL } from './constants';
import { SummaryCards } from './components/SummaryCards';
import { LedgerTable } from './components/LedgerTable';
import { TransactionForm } from './components/TransactionForm';
import { SettingsModal } from './components/SettingsModal';
import { FilterBar } from './components/FilterBar';
import { ToastContainer } from './components/Toast';

const App: React.FC = () => {
  // --- State ---
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Editing State
  const [editingEntry, setEditingEntry] = useState<LedgerEntry | null>(null);

  // Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>(() => new Date().toISOString().slice(0, 7)); // Default to current YYYY-MM

  // Load Config
  const [config, setConfig] = useState<AppConfig>(() => {
    const saved = localStorage.getItem(INITIAL_CONFIG_KEY);
    return saved ? JSON.parse(saved) : { mode: 'LIVE', gasDeploymentUrl: DEFAULT_GAS_URL, apiToken: '' };
  });

  // --- Effects ---

  useEffect(() => {
    localStorage.setItem(INITIAL_CONFIG_KEY, JSON.stringify(config));
  }, [config]);

  // Toast Helper
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, message, type }]);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Fetch Data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchEntries(config);
      // Sort by date desc
      const sorted = [...data].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setEntries(sorted);
    } catch (err: any) {
      showToast(err.message || 'Failed to load ledger data.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [config, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // --- Handlers ---

  const handleFormSubmit = async (entry: LedgerEntry) => {
    setIsSubmitting(true);
    try {
      if (editingEntry) {
        // UPDATE MODE
        await updateEntry(entry, config);
        showToast('Transaction updated successfully', 'success');
        setEditingEntry(null); // Clear edit mode
      } else {
        // CREATE MODE
        await addEntry(entry, config);
        showToast('Transaction added successfully', 'success');
      }
      // Refresh data
      await loadData();
    } catch (err: any) {
      showToast(`Error saving transaction: ${err.message}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (entry: LedgerEntry) => {
    if (!entry.id) {
      showToast("Legacy entry lacks ID. Cannot edit.", 'error');
      return;
    }
    setEditingEntry(entry);
    // Scroll to top to see form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClick = async (entry: LedgerEntry) => {
    if (!entry.id) {
      showToast("Legacy entry lacks ID. Cannot delete.", 'error');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete "${entry.description}"?`)) return;

    setIsLoading(true); // Show loading state on table
    try {
      await deleteEntry(entry.id, config);
      showToast('Transaction deleted', 'info');
      await loadData();
    } catch (err: any) {
      showToast(`Error deleting transaction: ${err.message}`, 'error');
      setIsLoading(false);
    }
  };

  const handleSaveConfig = (newConfig: AppConfig) => {
    setConfig(newConfig);
    setShowSettings(false);
    showToast('Configuration saved', 'success');
  };

  const handleExportCSV = () => {
    if (filteredEntries.length === 0) {
      showToast('No data to export', 'info');
      return;
    }
    const headers = ['ID', 'Date', 'Description', 'Category', 'Amount', 'Created At'];
    const csvContent = [
      headers.join(','),
      ...filteredEntries.map(row => {
        const escape = (val: string | number | undefined) => `"${String(val ?? '').replace(/"/g, '""')}"`;
        return [
          escape(row.id),
          escape(row.date),
          escape(row.description),
          escape(row.category),
          row.amount,
          escape(row.createdAt)
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `wesledger_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Export generated', 'success');
  };

  // --- Derived State ---

  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      const matchesSearch = entry.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory ? entry.category === selectedCategory : true;
      
      let matchesMonth = true;
      if (selectedMonth) {
        // entry.date is YYYY-MM-DD. selectedMonth is YYYY-MM
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

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm backdrop-blur-md bg-white/90">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-9 h-9 bg-slate-900 text-white flex items-center justify-center rounded-lg font-bold font-mono text-xl shadow-lg shadow-slate-900/20">
               W
             </div>
             <div>
               <h1 className="text-xl font-bold tracking-tight text-slate-900">WesLedger</h1>
               <div className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold flex items-center gap-2">
                  System v1.6
                  <span className={`w-2 h-2 rounded-full ${config.mode === 'LIVE' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-amber-400'}`}></span>
               </div>
             </div>
          </div>
          
          <button 
            onClick={() => setShowSettings(true)}
            className="text-slate-600 hover:text-slate-900 text-sm font-medium flex items-center gap-2 px-3 py-2 rounded-md hover:bg-slate-50 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
              <path d="M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 0 1-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311c.446.82.023 1.841-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 0 1 .872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 0 1 2.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 0 1 2.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 0 1 .872-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 0 1-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 0 1-2.105-.872l-.1-.34zM8 10.93a2.929 2.929 0 1 1 0-5.86 2.929 2.929 0 0 1 0 5.858z"/>
            </svg>
            Config
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Financial Summary */}
        <SummaryCards metrics={metrics} />

        {/* Input Form */}
        <TransactionForm 
          onSubmit={handleFormSubmit} 
          isSubmitting={isSubmitting} 
          initialData={editingEntry}
          onCancelEdit={() => setEditingEntry(null)}
        />

        {/* Filters */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
             <div className="flex items-baseline gap-3">
               <h2 className="text-xl font-bold text-slate-800 tracking-tight">Ledger Entries</h2>
               <span className="text-sm text-slate-400 font-mono">
                 {filteredEntries.length} Records
               </span>
             </div>
             
             {filteredEntries.length > 0 && (
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
           />
        </div>

      </main>

      {/* Settings Modal */}
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