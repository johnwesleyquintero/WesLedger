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
  URL.revokeObjectURL(url);
  
  return true;
};

export const copyTableAsMarkdown = (entries: LedgerEntry[]): boolean => {
  if (entries.length === 0) return false;

  const headers = ['Date', 'Description', 'Category', 'Amount'];
  const headerRow = `| ${headers.join(' | ')} |`;
  const separatorRow = `| ${headers.map(() => '---').join(' | ')} |`;
  
  const dataRows = entries.map(row => {
    const escapePipe = (val: string | number | undefined) => 
      String(val ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
    return [
      escapePipe(row.date),
      escapePipe(row.description),
      escapePipe(row.category),
      escapePipe(row.amount)
    ].join(' | ');
  });

  const markdownContent = [headerRow, separatorRow, ...dataRows.map(row => `| ${row} |`)].join('\n');

  navigator.clipboard.writeText(markdownContent).then(() => {
    console.log('Markdown table copied to clipboard');
  }).catch((err) => {
    console.error('Failed to copy markdown:', err);
  });

  return true;
};