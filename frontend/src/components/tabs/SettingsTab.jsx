import React, { useState } from 'react';
import { Settings, FolderOpen, Save, CheckCircle } from 'lucide-react';

const SettingsTab = ({ getTitle }) => {
  const [receiptPath, setReceiptPath] = useState('C:\\Users\\Documents\\Kvitton');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // Simulate save
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
            {getTitle()}
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
            Konfigurera applikationens inställningar
          </p>
        </div>
      </div>

      {/* Settings Sections */}
      <div className="grid grid-cols-1 gap-6">
        
        {/* Receipt Storage Section */}
        <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/50 rounded-2xl p-6 shadow-sm dark:shadow-none">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
              <FolderOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Kvittolagring</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Välj var kvitton ska sparas</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Sökväg för kvitton
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={receiptPath}
                  onChange={(e) => setReceiptPath(e.target.value)}
                  placeholder="C:\Dokument\Kvitton"
                  className="flex-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
                <button 
                  onClick={handleSave}
                  className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
                    saved 
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                  }`}
                >
                  {saved ? (
                    <>
                      <CheckCircle size={18} />
                      Sparad
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Spara
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Kvitton kommer automatiskt att sparas i denna mapp när de laddas upp.
              </p>
            </div>

            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700">
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400">
                  <p className="font-medium mb-1">Tips:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Använd en molnsynkad mapp för automatisk backup</li>
                    <li>• Skapa undermappar per år/månad för bättre organisation</li>
                    <li>• Se till att mappen har skrivrättigheter</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Application Settings */}
        <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/50 rounded-2xl p-6 shadow-sm dark:shadow-none">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
              <Settings className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
            </div>
            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Allmänna inställningar</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Applikationsinställningar</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Dark Mode Toggle */}
            <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Mörkt tema</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Växla mellan ljust och mörkt läge</p>
              </div>
              <div className="text-xs text-zinc-500">
                (Använd växlaren i sidofältet)
              </div>
            </div>

            {/* Language */}
            <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Språk</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Applikationens språk</p>
              </div>
              <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-lg text-xs font-medium">
                Svenska
              </span>
            </div>

            {/* Currency */}
            <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Valuta</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Standard valuta för transaktioner</p>
              </div>
              <span className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-700">
                SEK (kr)
              </span>
            </div>
          </div>
        </div>

        {/* About Section */}
        <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/50 rounded-2xl p-6 shadow-sm dark:shadow-none">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Om WestBudget</h3>
          <div className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
            <div className="flex justify-between">
              <span>Version:</span>
              <span className="font-mono text-zinc-900 dark:text-white">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span>Byggd med:</span>
              <span className="text-zinc-900 dark:text-white">React + Flask</span>
            </div>
            <div className="flex justify-between">
              <span>Licens:</span>
              <span className="text-zinc-900 dark:text-white">Premium</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SettingsTab;

