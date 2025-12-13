import { useMemo } from 'react';
import { LedgerEntry, MetricSummary } from '../types';

interface UseLedgerAnalyticsProps {
  entries: LedgerEntry[];
  searchQuery: string;
  selectedCategory: string;
  selectedMonth: string;
}

export const useLedgerAnalytics = ({
  entries,
  searchQuery,
  selectedCategory,
  selectedMonth,
}: UseLedgerAnalyticsProps) => {
  
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

  return {
    filteredEntries,
    metrics
  };
};