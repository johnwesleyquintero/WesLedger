import React, { useState, useEffect } from 'react';
import { AppConfig } from '../types';
import { CURRENCY_OPTIONS } from '../constants';
import { GAS_BACKEND_CODE } from '../assets/gasSource';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AppConfig;
  onSave: (config: AppConfig) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, config, onSave }) => {
  const [localConfig, setLocalConfig] = useState<AppConfig>(config);
  const [activeTab, setActiveTab] = useState<'CONFIG' | 'CODE'>('CONFIG');
  const [copyFeedback, setCopyFeedback] = useState<string>('Copy Code');

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(GAS_BACKEND_CODE);
    setCopyFeedback('Copied!');
    setTimeout(() => setCopyFeedback('Copy Code'), 2000);
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCode = e.target.value;
    const selectedOption = CURRENCY_OPTIONS.find(c => c.code === selectedCode);
    if (selectedOption) {
      setLocalConfig({
        ...localConfig,
        currency: selectedOption.code,
        locale: selectedOption.locale
      });
    }
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
              
              {/* Currency Selector */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Base Currency</label>
                <select
                  className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 bg-white"
                  value={localConfig.currency}
                  onChange={handleCurrencyChange}
                >
                  {CURRENCY_OPTIONS.map(opt => (
                    <option key={opt.code} value={opt.code}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="border-t border-slate-200 pt-4">
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
                    value={GAS_BACKEND_CODE}
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