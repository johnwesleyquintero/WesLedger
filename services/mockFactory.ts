import { LedgerEntry } from '../types';

export const getMockData = (): LedgerEntry[] => {
  const entries: LedgerEntry[] = [];
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  // Helper to create date in current month
  const dateIn = (day: number) => {
    const d = new Date(year, month, day);
    // don't go into future if possible, but for demo it's fine
    return d.toISOString().split('T')[0];
  };

  // 1. Opening Balance / Income
  entries.push({ id: 'init-1', date: dateIn(1), description: 'Client Retainer - Alpha', amount: 5000.00, category: 'Income', createdAt: new Date().toISOString() });
  entries.push({ id: 'init-2', date: dateIn(15), description: 'Digital Product Sales', amount: 1250.00, category: 'Income', createdAt: new Date().toISOString() });

  // 2. Periodic Expenses
  entries.push({ id: 'exp-1', date: dateIn(2), description: 'Vercel Pro', amount: -20.00, category: 'Software/SaaS', createdAt: new Date().toISOString() });
  entries.push({ id: 'exp-2', date: dateIn(3), description: 'Supabase Database', amount: -25.00, category: 'Software/SaaS', createdAt: new Date().toISOString() });
  entries.push({ id: 'exp-3', date: dateIn(5), description: 'Anthropic API Credits', amount: -50.00, category: 'Operations', createdAt: new Date().toISOString() });
  entries.push({ id: 'exp-4', date: dateIn(10), description: 'Office Internet Fiber', amount: -89.99, category: 'Utilities', createdAt: new Date().toISOString() });
  entries.push({ id: 'exp-5', date: dateIn(12), description: 'Local Coffee Roasters', amount: -24.50, category: 'Lifestyle', createdAt: new Date().toISOString() });
  entries.push({ id: 'exp-6', date: dateIn(18), description: 'Uber to Airport', amount: -45.00, category: 'Transport', createdAt: new Date().toISOString() });
  entries.push({ id: 'exp-7', date: dateIn(20), description: 'Gym Membership', amount: -60.00, category: 'Health', createdAt: new Date().toISOString() });
  entries.push({ id: 'exp-8', date: dateIn(22), description: 'Cursor AI Subscription', amount: -20.00, category: 'Software/SaaS', createdAt: new Date().toISOString() });
  entries.push({ id: 'exp-9', date: dateIn(25), description: 'Whole Foods Market', amount: -145.20, category: 'Lifestyle', createdAt: new Date().toISOString() });
  entries.push({ id: 'exp-10', date: dateIn(28), description: 'Domain Renewals', amount: -35.00, category: 'Operations', createdAt: new Date().toISOString() });

  // Sort by date desc
  return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};