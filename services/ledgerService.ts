import { LedgerEntry, AppConfig } from '../types';
import { LOCAL_STORAGE_KEY } from '../constants';

/* 
  === GOOGLE APPS SCRIPT BACKEND CODE ===
  
  Copy and paste this into your Google Apps Script project (Code.gs).
  Publish as Web App -> Execute as: Me -> Who has access: Anyone.

  ```javascript
  function doGet(e) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ledger');
    if (!sheet) return ContentService.createTextOutput(JSON.stringify({error: "Sheet 'ledger' not found"})).setMimeType(ContentService.MimeType.JSON);
    
    const data = sheet.getDataRange().getValues();
    const headers = data.shift(); // Remove headers
    
    // Convert to array of objects
    const entries = data.map(row => ({
      date: row[0],
      description: row[1],
      amount: row[2],
      category: row[3],
      createdAt: row[4]
    })).filter(e => e.date !== ""); // Basic filter for empty rows

    return ContentService.createTextOutput(JSON.stringify(entries))
      .setMimeType(ContentService.MimeType.JSON);
  }

  function doPost(e) {
    try {
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ledger');
      if (!sheet) return ContentService.createTextOutput(JSON.stringify({status: "error", message: "Sheet 'ledger' not found"})).setMimeType(ContentService.MimeType.JSON);
      
      const body = JSON.parse(e.postData.contents);
      
      const newRow = [
        body.date,
        body.description,
        body.amount,
        body.category,
        new Date().toISOString()
      ];
      
      sheet.appendRow(newRow);
      
      return ContentService.createTextOutput(JSON.stringify({status: "success", row: newRow}))
        .setMimeType(ContentService.MimeType.JSON);
    } catch (err) {
      return ContentService.createTextOutput(JSON.stringify({status: "error", message: err.toString()}))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }
  ```
*/

// Mock Data for Demo Mode
const MOCK_DATA: LedgerEntry[] = [
  { date: '2023-10-25', description: 'Stripe Payout', amount: 4500.00, category: 'Income', createdAt: new Date().toISOString() },
  { date: '2023-10-26', description: 'Vercel Subscription', amount: -20.00, category: 'Software/SaaS', createdAt: new Date().toISOString() },
  { date: '2023-10-27', description: 'Supabase Compute', amount: -25.00, category: 'Software/SaaS', createdAt: new Date().toISOString() },
  { date: '2023-10-28', description: 'Consulting Fee', amount: 1200.00, category: 'Income', createdAt: new Date().toISOString() },
  { date: '2023-10-29', description: 'Office Supplies', amount: -145.50, category: 'Operations', createdAt: new Date().toISOString() },
];

export const fetchEntries = async (config: AppConfig): Promise<LedgerEntry[]> => {
  if (config.mode === 'DEMO') {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(MOCK_DATA));
      return MOCK_DATA;
    }
    return JSON.parse(stored);
  } else {
    // LIVE MODE
    if (!config.gasDeploymentUrl) throw new Error("GAS URL not configured");
    try {
      const response = await fetch(config.gasDeploymentUrl);
      if (!response.ok) throw new Error("Network response was not ok");
      
      const data = await response.json();
      
      // Handle potential API error response
      if (data && data.error) {
        throw new Error(data.error);
      }
      
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("Fetch Error:", error);
      throw error;
    }
  }
};

export const addEntry = async (entry: LedgerEntry, config: AppConfig): Promise<void> => {
  if (config.mode === 'DEMO') {
    await new Promise(resolve => setTimeout(resolve, 600));
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    const current = stored ? JSON.parse(stored) : [];
    const newEntry = { ...entry, createdAt: new Date().toISOString() };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([newEntry, ...current])); // Prepend
  } else {
    if (!config.gasDeploymentUrl) throw new Error("GAS URL not configured");
    
    // IMPORTANT: Google Apps Script Web App POST requests redirect.
    // We must use mode: 'no-cors' to allow the request to complete without preflight issues.
    // The trade-off is we get an opaque response (we can't read the JSON result), 
    // but the data will be written to the sheet.
    await fetch(config.gasDeploymentUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(entry),
    });
  }
};