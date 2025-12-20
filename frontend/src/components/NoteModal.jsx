import React, { useState } from 'react';
import { MessageSquare, X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeButtonClass, getThemeTextClass, getThemeRingClass } from '../utils/getThemeClasses';

const NoteModal = ({ transaction, onClose, onSave }) => {
  const { colorTheme } = useTheme();
  const [note, setNote] = useState(transaction?.note || "");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(transaction.id, note);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between flex-shrink-0">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <MessageSquare size={18} className={getThemeTextClass(colorTheme, false)} />
            Anteckning
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
            <X size={20} className="text-zinc-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 min-h-0">
          <div className="mb-4">
            <p className="text-sm text-zinc-500 mb-2">Transaktion:</p>
            <p className="font-medium text-zinc-900 dark:text-white">{transaction.title}</p>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Din notering</label>
            <textarea 
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Skriv en kommentar..."
              className={`w-full h-32 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white outline-none focus:ring-2 ${getThemeRingClass(colorTheme)} resize-none`}
              autoFocus
            />
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-zinc-600 dark:text-zinc-300 font-medium hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              Avbryt
            </button>
            <button 
              type="submit"
              className={`px-6 py-2 ${getThemeButtonClass(colorTheme, 'primary')} font-semibold rounded-lg shadow-lg transition-all`}
            >
              Spara
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NoteModal;

