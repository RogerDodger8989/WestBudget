import React, { useState } from 'react';
import { X, FileSpreadsheet, CheckCircle } from 'lucide-react';

const ImportModal = ({ onClose, onImport }) => {
  const [step, setStep] = useState(1);
  const [bank, setBank] = useState('swedbank');
  const [isDragging, setIsDragging] = useState(false);

  const importedData = [
    { title: "Elgiganten", date: "2024-12-16", amount: "-4,990 kr", type: "expense", category: "Inventarier", status: "Bokförd", note: "", receipt: false },
    { title: "Pressbyrån", date: "2024-12-16", amount: "-45 kr", type: "expense", category: "Övrigt", status: "Bokförd", note: "Kaffe till mötet", receipt: false },
    { title: "Inbetalning 403", date: "2024-12-15", amount: "+8,000 kr", type: "income", category: "Försäljning Tjänst", status: "Bokförd", note: "", receipt: false }
  ];

  const handleUpload = () => {
    setTimeout(() => setStep(2), 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
            {step === 1 ? 'Importera Transaktioner' : 'Granska Import'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
            <X size={20} className="text-zinc-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {step === 1 ? (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Välj Bank / Källa</label>
                <select 
                  value={bank}
                  onChange={(e) => setBank(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="swedbank">Swedbank (CSV)</option>
                  <option value="seb">SEB (Excel/CSV)</option>
                  <option value="nordea">Nordea</option>
                  <option value="handelsbanken">Handelsbanken</option>
                  <option value="revolut">Revolut Business</option>
                </select>
                <p className="text-xs text-zinc-500">Vi anpassar formatet automatiskt efter din bank.</p>
              </div>

              <div 
                className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  isDragging 
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10' 
                    : 'border-zinc-300 dark:border-zinc-700 hover:border-indigo-500 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                }`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleUpload(); }}
                onClick={handleUpload}
              >
                <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-4 text-indigo-600 dark:text-indigo-400">
                  <FileSpreadsheet size={32} />
                </div>
                <h3 className="text-lg font-medium text-zinc-900 dark:text-white">Klicka eller dra fil hit</h3>
                <p className="text-sm text-zinc-500 mt-2 max-w-xs mx-auto">
                  Stöder .CSV och .XLSX filer exporterade direkt från din internetbank.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-200 rounded-xl border border-emerald-100 dark:border-emerald-800">
                <CheckCircle size={20} />
                <div>
                  <p className="font-semibold text-sm">Filen analyserad!</p>
                  <p className="text-xs opacity-80">Vi hittade 3 nya transaktioner. Dubbletter har rensats bort.</p>
                </div>
              </div>

              <div className="border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-zinc-50 dark:bg-zinc-800 text-zinc-500 font-medium">
                    <tr>
                      <th className="px-4 py-3">Datum</th>
                      <th className="px-4 py-3">Beskrivning</th>
                      <th className="px-4 py-3">Belopp</th>
                      <th className="px-4 py-3">Auto-Kategori</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                    {importedData.map((row, i) => (
                      <tr key={i} className="bg-white dark:bg-zinc-900">
                        <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{row.date}</td>
                        <td className="px-4 py-3 font-medium text-zinc-900 dark:text-white">{row.title}</td>
                        <td className={`px-4 py-3 font-mono ${row.type === 'income' ? 'text-emerald-600' : 'text-zinc-900 dark:text-zinc-300'}`}>
                          {row.amount}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded text-xs border border-zinc-200 dark:border-zinc-700">
                            {row.category}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-zinc-600 dark:text-zinc-300 font-medium hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            Avbryt
          </button>
          {step === 1 ? (
            <button 
              disabled={true} 
              className="px-6 py-2 bg-zinc-300 dark:bg-zinc-800 text-zinc-500 cursor-not-allowed font-semibold rounded-lg"
            >
              Ladda upp fil först
            </button>
          ) : (
            <button 
              onClick={() => onImport(importedData)}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-lg shadow-indigo-500/20 transition-all"
            >
              Importera 3 rader
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default ImportModal;

