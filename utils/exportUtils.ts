import { LedgerEntry } from '../types';

export const generateAndDownloadCSV = (entries: LedgerEntry[]) => {
  if (entries.length === 0) return false;

  const headers = ['ID', 'Date', 'Description', 'Category', 'Amount', 'Created At'];
  const csvContent = [
    headers.join(','),
    ...entries.map(row => {
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
  
  return true;
};