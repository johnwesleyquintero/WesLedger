import React, { useState, useEffect } from 'react';
import { AppConfig } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AppConfig;
  onSave: (config: AppConfig) => void;
}

const GAS_CODE = `// --- CONFIGURATION ---
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
}`;

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, config, onSave }) => {
  const [localConfig, setLocalConfig] = useState<AppConfig>(config);
  const [activeTab, setActiveTab] = useState<'CONFIG' | 'CODE'>('CONFIG');
  const [copyFeedback, setCopyFeedback] = useState<string>('Copy Code');

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(GAS_CODE);
    setCopyFeedback('Copied!');
    setTimeout(() => setCopyFeedback('Copy Code'), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl rounded-lg shadow-xl m-4 flex flex-col max-h-[90vh]">
        
        {/* Header with Tabs */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
           <h2 className="text-xl font-bold text-slate-900">System Setup</h2>
           <div className="flex bg-slate-100 rounded-lg p-1">
             <button
               onClick={() => setActiveTab('CONFIG')}
               className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'CONFIG' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
             >
               CONNECTION
             </button>
             <button
               onClick={() => setActiveTab('CODE')}
               className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'CODE' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
             >
               BACKEND CODE
             </button>
           </div>
        </div>
        
        {/* Content Area - Scrollable */}
        <div className="p-6 overflow-y-auto">
          
          {activeTab === 'CONFIG' && (
            <div className="space-y-6">
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Operation Mode</label>
                <div className="flex gap-4">
                  <button
                    onClick={() => setLocalConfig({ ...localConfig, mode: 'DEMO' })}
                    className={`flex-1 py-3 px-4 rounded text-sm font-medium border transition-all ${localConfig.mode === 'DEMO' ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}
                  >
                    Demo (Local)
                  </button>
                  <button
                    onClick={() => setLocalConfig({ ...localConfig, mode: 'LIVE' })}
                    className={`flex-1 py-3 px-4 rounded text-sm font-medium border transition-all ${localConfig.mode === 'LIVE' ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}
                  >
                    Live (Google Sheets)
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  {localConfig.mode === 'DEMO' 
                    ? "Data is stored in your browser's LocalStorage. Good for testing." 
                    : "Data is synced with your sovereign Google Sheet."}
                </p>
              </div>

              {localConfig.mode === 'LIVE' && (
                <div className="space-y-4 p-4 bg-slate-50 rounded border border-slate-200">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">GAS Web App URL</label>
                    <input
                      type="text"
                      placeholder="https://script.google.com/macros/s/..."
                      className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                      value={localConfig.gasDeploymentUrl}
                      onChange={(e) => setLocalConfig({ ...localConfig, gasDeploymentUrl: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">API Secret Token</label>
                    <input
                      type="password"
                      placeholder="e.g. secret-key-123"
                      className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 font-mono"
                      value={localConfig.apiToken || ''}
                      onChange={(e) => setLocalConfig({ ...localConfig, apiToken: e.target.value })}
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Must match the <code>API_SECRET</code> variable in your Google Apps Script.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'CODE' && (
            <div>
               <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded mb-4 text-xs">
                 <strong>Instruction:</strong> Copy the code below and paste it into <code>Code.gs</code> in your Google Sheet's Apps Script editor. <br/>
                 Don't forget to update the <code>API_SECRET</code> at the top!
               </div>
               <div className="relative">
                 <button 
                   onClick={handleCopyCode}
                   className="absolute top-2 right-2 text-xs bg-slate-800 text-white px-3 py-1.5 rounded hover:bg-slate-700 transition-colors"
                 >
                   {copyFeedback}
                 </button>
                 <textarea
                    readOnly
                    className="w-full h-80 bg-slate-900 text-slate-300 font-mono text-xs p-4 rounded border border-slate-700 focus:outline-none"
                    value={GAS_CODE}
                 />
               </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-lg">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(localConfig)}
            className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded hover:bg-slate-800 shadow-sm"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};