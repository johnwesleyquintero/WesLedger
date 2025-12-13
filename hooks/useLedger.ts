import { useState, useCallback, useEffect } from 'react';
import { LedgerEntry, AppConfig } from '../types';
import { fetchEntries, addEntry, updateEntry, deleteEntry } from '../services/ledgerService';

export const useLedger = (
  config: AppConfig, 
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void
) => {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

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

  // Initial Load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Create or Update
  const saveTransaction = async (entry: LedgerEntry, isUpdate: boolean) => {
    setIsSubmitting(true);
    try {
      if (isUpdate) {
        await updateEntry(entry, config);
        showToast('Transaction updated successfully', 'success');
      } else {
        await addEntry(entry, config);
        showToast('Transaction added successfully', 'success');
      }
      await loadData();
      return true;
    } catch (err: any) {
      showToast(`Error saving transaction: ${err.message}`, 'error');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Single
  const removeTransaction = async (entry: LedgerEntry) => {
    if (!entry.id) {
      showToast("Legacy entry lacks ID. Cannot delete.", 'error');
      return false;
    }
    
    setIsLoading(true); 
    try {
      await deleteEntry(entry.id, config);
      showToast('Transaction deleted', 'info');
      await loadData();
      return true;
    } catch (err: any) {
      showToast(`Error deleting transaction: ${err.message}`, 'error');
      setIsLoading(false);
      return false;
    }
  };

  // Bulk Delete
  const bulkRemoveTransactions = async (entriesToDelete: LedgerEntry[]) => {
    if (entriesToDelete.length === 0) return;

    setIsLoading(true);
    try {
      let deletedCount = 0;
      for (const entry of entriesToDelete) {
        if (entry.id) {
          await deleteEntry(entry.id, config);
          deletedCount++;
        }
      }
      showToast(`Successfully deleted ${deletedCount} entries`, 'success');
      await loadData();
    } catch (err: any) {
      showToast(`Error during bulk delete: ${err.message}`, 'error');
      await loadData();
    } finally {
      setIsLoading(false);
    }
  };

  return {
    entries,
    isLoading,
    isSubmitting,
    loadData,
    saveTransaction,
    removeTransaction,
    bulkRemoveTransactions
  };
};