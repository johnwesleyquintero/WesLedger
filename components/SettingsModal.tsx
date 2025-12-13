import React, { useState, useEffect } from 'react';
import { AppConfig } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AppConfig;
  onSave: (config: AppConfig) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, config, onSave }) => {
  const [localConfig, setLocalConfig] = useState<AppConfig>(config);

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-lg shadow-xl p-6 m-4">
        <h2 className="text-xl font-bold text-slate-900 mb-4">System Configuration</h2>
        
        <div className="mb-6">
          <label className="block text-sm font-semibold text-slate-700 mb-2">Operation Mode</label>
          <div className="flex gap-4">
            <button
              onClick={() => setLocalConfig({ ...localConfig, mode: 'DEMO' })}
              className={`flex-1 py-2 px-4 rounded text-sm font-medium border ${localConfig.mode === 'DEMO' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}
            >
              Demo (Local)
            </button>
            <button
              onClick={() => setLocalConfig({ ...localConfig, mode: 'LIVE' })}
              className={`flex-1 py-2 px-4 rounded text-sm font-medium border ${localConfig.mode === 'LIVE' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}
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
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-700 mb-2">GAS Web App URL</label>
            <input
              type="text"
              placeholder="https://script.google.com/macros/s/..."
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              value={localConfig.gasDeploymentUrl}
              onChange={(e) => setLocalConfig({ ...localConfig, gasDeploymentUrl: e.target.value })}
            />
            <p className="text-xs text-slate-500 mt-2">
              Deploy your Google Apps Script as a Web App (Execute as: Me, Access: Anyone) and paste the URL here.
            </p>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(localConfig)}
            className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded hover:bg-slate-800"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};