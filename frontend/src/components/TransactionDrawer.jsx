import React, { useRef } from 'react';
import { X, Tag, FileText, CheckCircle, UploadCloud, Trash2, ChevronRight } from 'lucide-react';

const TransactionDrawer = ({ transaction, onClose, onCategoryChange, onReceiptUpload, categories }) => {
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && onReceiptUpload) {
      onReceiptUpload(transaction.id, file);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-start justify-between bg-zinc-50 dark:bg-zinc-900/50">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">{transaction.title}</h2>
          <p className="text-sm text-zinc-500">{transaction.date}</p>
        </div>
        <button 
          onClick={onClose} 
          className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        
        <div className="text-center py-4">
          <span className={`text-4xl font-bold tracking-tight ${
            transaction.type === 'income' ? 'text-emerald-500' : 'text-zinc-900 dark:text-white'
          }`}>
            {transaction.amount}
          </span>
          <div className="mt-2 flex items-center justify-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
              transaction.status === 'Bokförd' 
                ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' 
                : 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
            }`}>
              {transaction.status}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
            <Tag size={14} /> Kategori
          </label>
          <div className="relative">
            <select 
              value={transaction.category}
              onChange={(e) => onCategoryChange(transaction.id, e.target.value)}
              className="w-full appearance-none bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 pr-10 text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all cursor-pointer"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 rotate-90 pointer-events-none" />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
              <FileText size={14} /> Underlag & Kvitto
            </label>
            {transaction.receipt && (
              <span className="text-xs text-emerald-500 flex items-center gap-1 font-medium">
                <CheckCircle size={12} /> Kvitto finns
              </span>
            )}
          </div>
          
          <input 
            ref={fileInputRef}
            type="file" 
            accept=".pdf,.png,.jpg,.jpeg,.gif"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-indigo-500 dark:hover:border-indigo-500 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-zinc-50 dark:bg-zinc-800/30 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 group"
          >
            <div className="w-12 h-12 bg-white dark:bg-zinc-800 rounded-full flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform">
              <UploadCloud className="w-6 h-6 text-zinc-400 group-hover:text-indigo-500" />
            </div>
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Klicka för att ladda upp</p>
            <p className="text-xs text-zinc-500 mt-1">PDF, PNG, JPG (max 16MB)</p>
          </div>
          
          {transaction.receipt_path && (
            <div className="mt-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-100 dark:border-emerald-800">
              <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">Kvitto sparat:</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-mono truncate">{transaction.receipt_path}</p>
            </div>
          )}
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4 space-y-3 border border-zinc-100 dark:border-zinc-800">
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500">Transaktions-ID</span>
            <span className="font-mono text-zinc-700 dark:text-zinc-300">#{transaction.id.toString().padStart(6, '0')}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500">Bokföringskonto</span>
            <span className="font-mono text-zinc-700 dark:text-zinc-300">
              {transaction.type === 'income' ? '3001' : '4000'}
            </span>
          </div>
        </div>

      </div>

      <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex gap-3">
        <button className="flex-1 bg-zinc-900 dark:bg-white text-white dark:text-black font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity">
          Spara Ändringar
        </button>
        <button className="p-3 bg-rose-100 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-xl hover:bg-rose-200 dark:hover:bg-rose-900/40 transition-colors">
          <Trash2 size={20} />
        </button>
      </div>
    </div>
  );
};

export default TransactionDrawer;

