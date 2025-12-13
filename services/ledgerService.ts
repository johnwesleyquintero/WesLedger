import { LedgerEntry, AppConfig } from '../types';
import { LOCAL_STORAGE_KEY } from '../constants';

/* 
  === GOOGLE APPS SCRIPT BACKEND CODE (v4 - Robust) ===
  (See SettingsModal.tsx for the latest source)
*/

// Mock Data for Demo Mode
let MOCK_DATA: LedgerEntry[] = [
  { id: '1', date: '2023-10-25', description: 'Stripe Payout', amount: 4500.00, category: 'Income', createdAt: new Date().toISOString() },
  { id: '2', date: '2023-10-26', description: 'Vercel Subscription', amount: -20.00, category: 'Software/SaaS', createdAt: new Date().toISOString() },
  { id: '3', date: '2023-10-27', description: 'Supabase Compute', amount: -25.00, category: 'Software/SaaS', createdAt: new Date().toISOString() },
];

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
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(MOCK_DATA));
      return MOCK_DATA;
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