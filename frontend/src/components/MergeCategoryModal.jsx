import React, { useState, useEffect } from 'react';
import { Merge, X, AlertCircle } from 'lucide-react';

const MergeCategoryModal = ({ isOpen, onClose, categories, onMerge }) => {
  const [sourceId, setSourceId] = useState('');
  const [targetId, setTargetId] = useState('');
  const [newName, setNewName] = useState('');

  const sourceCategory = categories.find(c => c.id === parseInt(sourceId));
  const targetCategory = categories.find(c => c.id === parseInt(targetId));

  // Auto-fill new name when target is selected
  useEffect(() => {
    if (isOpen && targetCategory && !newName) {
      setNewName(targetCategory.name);
    }
  }, [targetId, targetCategory, isOpen, newName]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSourceId('');
      setTargetId('');
      setNewName('');
    }
  }, [isOpen]);

  const handleMerge = () => {
    if (!sourceId || !targetId || !newName.trim()) {
      alert('Välj båda kategorier och ange ett nytt namn');
      return;
    }

    if (sourceId === targetId) {
      alert('Du kan inte merga en kategori med sig själv');
      return;
    }

    onMerge(parseInt(sourceId), parseInt(targetId), newName.trim());
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <Merge size={18} className="text-indigo-500" />
            Merga Kategorier
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
            <X size={20} className="text-zinc-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertCircle size={18} className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-800 dark:text-amber-300">
                <p className="font-medium mb-1">Viktigt:</p>
                <p>Alla transaktioner och avtal som använder källkategorin kommer att uppdateras till det nya namnet. Källkategorin kommer att tas bort.</p>
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2 block">
              Från kategori (källa)
            </label>
            <select
              value={sourceId}
              onChange={(e) => setSourceId(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-4 py-2 text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Välj kategori...</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} ({cat.total_usage || 0} användningar)
                </option>
              ))}
            </select>
            {sourceCategory && (
              <p className="text-xs text-zinc-500 mt-1">
                {sourceCategory.transaction_count || 0} transaktioner, {sourceCategory.agreement_count || 0} avtal
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2 block">
              Till kategori (mål)
            </label>
            <select
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-4 py-2 text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Välj kategori...</option>
              {categories.filter(c => c.id !== parseInt(sourceId)).map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} ({cat.total_usage || 0} användningar)
                </option>
              ))}
            </select>
            {targetCategory && (
              <p className="text-xs text-zinc-500 mt-1">
                {targetCategory.transaction_count || 0} transaktioner, {targetCategory.agreement_count || 0} avtal
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2 block">
              Nytt namn för merged kategori
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ange nytt namn..."
              className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-4 py-2 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-xs text-zinc-500 mt-1">
              Detta namn kommer att användas för den merged kategorin
            </p>
          </div>
        </div>

        <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-zinc-600 dark:text-zinc-300 font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            Avbryt
          </button>
          <button
            onClick={handleMerge}
            disabled={!sourceId || !targetId || !newName.trim() || sourceId === targetId}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Merga Kategorier
          </button>
        </div>
      </div>
    </div>
  );
};

export default MergeCategoryModal;

