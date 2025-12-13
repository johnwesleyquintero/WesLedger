import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { LedgerEntry, AppConfig, MetricSummary } from './types';
import { fetchEntries, addEntry, updateEntry, deleteEntry } from './services/ledgerService';
import { INITIAL_CONFIG_KEY, DEFAULT_GAS_URL } from './constants';
import { SummaryCards } from './components/SummaryCards';
import { LedgerTable } from './components/LedgerTable';
import { TransactionForm } from './components/TransactionForm';
import { SettingsModal } from './components/SettingsModal';
import { FilterBar } from './components/FilterBar';

const App: React.FC = () => {
  // --- State ---
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  
  // Editing State
  const [editingEntry, setEditingEntry] = useState<LedgerEntry | null>(null);

  // Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Load Config
  const [config, setConfig] = useState<AppConfig>(() => {
    const saved = localStorage.getItem(INITIAL_CONFIG_KEY);
    return saved ? JSON.parse(saved) : { mode: 'LIVE', gasDeploymentUrl: DEFAULT_GAS_URL };
  });

  // --- Effects ---

  useEffect(() => {
    localStorage.setItem(INITIAL_CONFIG_KEY, JSON.stringify(config));
  }, [config]);

  // Fetch Data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchEntries(config);
      // Sort by date desc
      const sorted = [...data].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setEntries(sorted);
    } catch (err: any) {
      setError(err.message || 'Failed to load ledger data.');
    } finally {
      setIsLoading(false);
    }
  }, [config]);

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
        setEditingEntry(null); // Clear edit mode
      } else {
        // CREATE MODE
        await addEntry(entry, config);
      }
      // Refresh data
      await loadData();
    } catch (err: any) {
      alert(`Error saving transaction: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (entry: LedgerEntry) => {
    if (!entry.id) {
      alert("This legacy entry cannot be edited because it lacks an ID. Please add an ID in the spreadsheet manually to enable editing.");
      return;
    }
    setEditingEntry(entry);
    // Scroll to top to see form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClick = async (entry: LedgerEntry) => {
    if (!entry.id) {
      alert("This legacy entry cannot be deleted because it lacks an ID.");
      return;
    }
    if (!window.confirm(`Are you sure you want to delete "${entry.description}"?`)) return;

    setIsLoading(true); // Show loading state on table
    try {
      await deleteEntry(entry.id, config);
      await loadData();
    } catch (err: any) {
      alert(`Error deleting transaction: ${err.message}`);
      setIsLoading(false);
    }
  };

  const handleSaveConfig = (newConfig: AppConfig) => {
    setConfig(newConfig);
    setShowSettings(false);
  };

  const handleExportCSV = () => {
    if (filteredEntries.length === 0) return;
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
  };

  // --- Derived State ---

  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      const matchesSearch = entry.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory ? entry.category === selectedCategory : true;
      return matchesSearch && matchesCategory;
    });
  }, [entries, searchQuery, selectedCategory]);

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
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-slate-900 text-white flex items-center justify-center rounded font-bold font-mono">
               W
             </div>
             <div>
               <h1 className="text-lg font-bold tracking-tight">WesLedger</h1>
               <div className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold flex items-center gap-2">
                  System v1.4
                  <span className={`w-2 h-2 rounded-full ${config.mode === 'LIVE' ? 'bg-green-500' : 'bg-orange-400'}`}></span>
               </div>
             </div>
          </div>
          
          <button 
            onClick={() => setShowSettings(true)}
            className="text-slate-500 hover:text-slate-900 text-sm font-medium flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z"/>
              <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115l.094-.319z"/>
            </svg>
            Config
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 text-red-700 border border-red-200 p-4 rounded mb-6 text-sm">
            <strong>System Alert:</strong> {error}
          </div>
        )}

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
             <h2 className="text-lg font-bold text-slate-800">Ledger Entries</h2>
             
             <div className="flex items-center gap-4">
               {filteredEntries.length > 0 && (
                 <button 
                   onClick={handleExportCSV}
                   className="text-sm font-medium text-slate-500 hover:text-slate-900 flex items-center gap-2 transition-colors"
                 >
                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                     <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                     <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
                   </svg>
                   Export View
                 </button>
               )}
               <span className="text-xs text-slate-400 font-mono">
                 {filteredEntries.length} RECORDS
               </span>
             </div>
           </div>
           
           <FilterBar 
             searchQuery={searchQuery}
             setSearchQuery={setSearchQuery}
             selectedCategory={selectedCategory}
             setSelectedCategory={setSelectedCategory}
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