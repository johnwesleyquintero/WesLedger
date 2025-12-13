import { LedgerEntry, AppConfig } from '../types';
import { LOCAL_STORAGE_KEY } from '../constants';

/* 
  === GOOGLE APPS SCRIPT BACKEND CODE (v4 - Robust) ===
  (See SettingsModal.tsx for the latest source)
*/

// Dynamic Mock Data generator
const getMockData = (): LedgerEntry[] => {
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

  const categories = ['Operations', 'Software/SaaS', 'Lifestyle', 'Health', 'Transport', 'Utilities'];

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

// Helper to send POST requests
const postToGas = async (url: string, payload: any) => {
  await fetch(url, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
  });
};

export const fetchEntries = async (config: AppConfig): Promise<LedgerEntry[]> => {
  if (config.mode === 'DEMO') {
    await new Promise(resolve => setTimeout(resolve, 500));
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!stored) {
      const initialData = getMockData();
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initialData));
      return initialData;
    }
    return JSON.parse(stored);
  } else {
    // LIVE MODE
    if (!config.gasDeploymentUrl) throw new Error("GAS URL not configured");
    if (!config.apiToken) throw new Error("API Token required");

    try {
      // Append token to URL parameters
      const urlWithToken = `${config.gasDeploymentUrl}?token=${encodeURIComponent(config.apiToken)}&t=${new Date().getTime()}`;
      
      console.log(`[WesLedger] Fetching from: ${config.gasDeploymentUrl}`);
      
      const response = await fetch(urlWithToken, { method: 'GET', redirect: 'follow' });
      
      if (!response.ok) throw new Error("Network response was not ok");
      
      const text = await response.text();
      // Debug logging to see what the server actually sends back
      console.log("[WesLedger] Raw Response:", text);

      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error("Invalid response from server. Check the console for Raw Response.");
      }
      
      if (data && data.status === "error") throw new Error(data.message);
      if (data && data.error) throw new Error(data.error);
      
      const entries = Array.isArray(data) ? data : [];
      console.log(`[WesLedger] Parsed ${entries.length} entries.`);
      return entries;

    } catch (error) {
      console.error("Fetch Error:", error);
      throw error;
    }
  }
};

export const addEntry = async (entry: LedgerEntry, config: AppConfig): Promise<void> => {
  const entryWithId = { ...entry, id: entry.id || crypto.randomUUID() };

  if (config.mode === 'DEMO') {
    await new Promise(resolve => setTimeout(resolve, 600));
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    const current = stored ? JSON.parse(stored) : [];
    const newEntry = { ...entryWithId, createdAt: new Date().toISOString() };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([newEntry, ...current]));
  } else {
    if (!config.gasDeploymentUrl) throw new Error("GAS URL not configured");
    // Send token in body
    await postToGas(config.gasDeploymentUrl, { 
      action: 'create', 
      entry: entryWithId,
      token: config.apiToken 
    });
  }
};

export const updateEntry = async (entry: LedgerEntry, config: AppConfig): Promise<void> => {
  if (config.mode === 'DEMO') {
    await new Promise(resolve => setTimeout(resolve, 600));
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    let current: LedgerEntry[] = stored ? JSON.parse(stored) : [];
    current = current.map(e => e.id === entry.id ? entry : e);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(current));
  } else {
    if (!config.gasDeploymentUrl) throw new Error("GAS URL not configured");
    await postToGas(config.gasDeploymentUrl, { 
      action: 'update', 
      entry,
      token: config.apiToken 
    });
  }
};

export const deleteEntry = async (id: string, config: AppConfig): Promise<void> => {
  if (config.mode === 'DEMO') {
    await new Promise(resolve => setTimeout(resolve, 600));
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    let current: LedgerEntry[] = stored ? JSON.parse(stored) : [];
    current = current.filter(e => e.id !== id);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(current));
  } else {
    if (!config.gasDeploymentUrl) throw new Error("GAS URL not configured");
    await postToGas(config.gasDeploymentUrl, { 
      action: 'delete', 
      entry: { id },
      token: config.apiToken 
    });
  }
};