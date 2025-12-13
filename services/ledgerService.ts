import { LedgerEntry, AppConfig } from '../types';
import { LOCAL_STORAGE_KEY } from '../constants';

/* 
  === GOOGLE APPS SCRIPT BACKEND CODE (v4 - Robust) ===
  
  Replace your entire Code.gs with this.
  
  CRITICAL: Change the API_SECRET variable below to your own password.
  Don't forget to deploy as 'New Version'.

  ```javascript
  // --- CONFIGURATION ---
  const API_SECRET = "wes-ledger-secret"; // <--- CHANGE THIS to your own strong password
  // ---------------------

  function doGet(e) {
    // 0. Handle Manual Execution (Play Button in Editor)
    if (!e || !e.parameter) {
      return ContentService.createTextOutput("System Online. Access this URL via your WesLedger App.");
    }

    // 1. Security Check
    const token = e.parameter.token;
    if (token !== API_SECRET) {
      return errorResponse("Unauthorized: Invalid Token");
    }

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ledger');
    if (!sheet) return errorResponse("Sheet 'ledger' not found");
    
    const data = sheet.getDataRange().getValues();
    if (data.length < 1) return jsonResponse([]);

    const headers = data.shift(); // Remove headers
    
    // Schema: Date(0), Desc(1), Amount(2), Category(3), CreatedAt(4), ID(5)
    const entries = data.map(row => ({
      date: row[0],
      description: row[1],
      amount: row[2],
      category: row[3],
      createdAt: row[4],
      id: row[5] || "" // Handle legacy rows without IDs
    })).filter(e => e.date !== "");

    return jsonResponse(entries);
  }

  function doPost(e) {
    // 0. Handle Manual Execution
    if (!e || !e.postData) {
      return ContentService.createTextOutput("System Online. Access this URL via your WesLedger App.");
    }

    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(10000); // Prevent race conditions
      
      const payload = JSON.parse(e.postData.contents);
      
      // 1. Security Check
      if (payload.token !== API_SECRET) {
         return errorResponse("Unauthorized: Invalid Token");
      }

      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ledger');
      if (!sheet) return errorResponse("Sheet 'ledger' not found");
      
      const action = payload.action || 'create';
      const entry = payload.entry;

      if (action === 'create') {
        const id = entry.id || Utilities.getUuid();
        const newRow = [
          entry.date,
          entry.description,
          entry.amount,
          entry.category,
          new Date().toISOString(),
          id
        ];
        sheet.appendRow(newRow);
        return jsonResponse({ status: "success", id: id });
      } 
      
      else if (action === 'update') {
        if (!entry.id) return errorResponse("ID required for update");
        const data = sheet.getDataRange().getValues();
        // Skip header (row 0), so loop starts at 1
        for (let i = 1; i < data.length; i++) {
          if (data[i][5] == entry.id) {
            const range = sheet.getRange(i + 1, 1, 1, 4);
            range.setValues([[entry.date, entry.description, entry.amount, entry.category]]);
            return jsonResponse({ status: "updated" });
          }
        }
        return errorResponse("ID not found");
      }
      
      else if (action === 'delete') {
        if (!entry.id) return errorResponse("ID required for delete");
        const data = sheet.getDataRange().getValues();
        for (let i = 1; i < data.length; i++) {
          if (data[i][5] == entry.id) {
            sheet.deleteRow(i + 1);
            return jsonResponse({ status: "deleted" });
          }
        }
        return errorResponse("ID not found");
      }

    } catch (err) {
      return errorResponse(err.toString());
    } finally {
      lock.releaseLock();
    }
  }

  function jsonResponse(data) {
    return ContentService.createTextOutput(JSON.stringify(data))
      .setMimeType(ContentService.MimeType.JSON);
  }

  function errorResponse(msg) {
    return ContentService.createTextOutput(JSON.stringify({status: "error", message: msg}))
      .setMimeType(ContentService.MimeType.JSON);
  }
  ```
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
      const response = await fetch(urlWithToken, { method: 'GET', redirect: 'follow' });
      
      if (!response.ok) throw new Error("Network response was not ok");
      
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error("Invalid response from server.");
      }
      
      if (data && data.status === "error") throw new Error(data.message);
      if (data && data.error) throw new Error(data.error);
      
      return Array.isArray(data) ? data : [];
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