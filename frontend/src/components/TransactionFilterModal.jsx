import React, { useState } from 'react';
import { Filter, X, SlidersHorizontal } from 'lucide-react';

const TransactionFilterModal = ({ 
  isOpen, 
  onClose, 
  categories = [], 
  filters, 
  onFiltersChange 
}) => {
  const [localFilters, setLocalFilters] = useState(filters || {
    type: 'all',
    category: 'all',
    status: 'all',
    hasReceipt: 'all',
    hasNote: 'all',
    minAmount: '',
    maxAmount: ''
  });

  if (!isOpen) return null;

  const handleFilterChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
  };

  const handleApply = () => {
    onFiltersChange(localFilters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters = {
      type: 'all',
      category: 'all',
      status: 'all',
      hasReceipt: 'all',
      hasNote: 'all',
      minAmount: '',
      maxAmount: ''
    };
    setLocalFilters(resetFilters);
    onFiltersChange(resetFilters);
    onClose();
  };

  const hasActiveFilters = () => {
    return localFilters.type !== 'all' ||
           localFilters.category !== 'all' ||
           localFilters.status !== 'all' ||
           localFilters.hasReceipt !== 'all' ||
           localFilters.hasNote !== 'all' ||
           localFilters.minAmount !== '' ||
           localFilters.maxAmount !== '';
  };

  const categoryList = categories.map(c => typeof c === 'string' ? c : c.name || c);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between flex-shrink-0">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <SlidersHorizontal size={18} className="text-indigo-500" />
            Filtrera Transaktioner
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
            <X size={20} className="text-zinc-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0">
          {/* Typ Filter */}
          <div>
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2 block">
              Typ
            </label>
            <div className="flex flex-wrap gap-2">
              {['all', 'income', 'expense'].map(type => (
                <button
                  key={type}
                  onClick={() => handleFilterChange('type', type)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    localFilters.type === type
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  {type === 'all' ? 'Alla' : type === 'income' ? 'Inkomst' : 'Utgift'}
                </button>
              ))}
            </div>
          </div>

          {/* Kategori Filter */}
          <div>
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2 block">
              Kategori
            </label>
            <select
              value={localFilters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="all">Alla Kategorier</option>
              {categoryList.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2 block">
              Status
            </label>
            <div className="flex flex-wrap gap-2">
              {['all', 'Bokförd', 'Väntande', 'Makulerad'].map(status => (
                <button
                  key={status}
                  onClick={() => handleFilterChange('status', status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    localFilters.status === status
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  {status === 'all' ? 'Alla' : status}
                </button>
              ))}
            </div>
          </div>

          {/* Beloppsintervall */}
          <div>
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2 block">
              Beloppsintervall
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 block">Min belopp</label>
                <input
                  type="number"
                  value={localFilters.minAmount}
                  onChange={(e) => handleFilterChange('minAmount', e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 block">Max belopp</label>
                <input
                  type="number"
                  value={localFilters.maxAmount}
                  onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
                  placeholder="Ingen gräns"
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Har Kvitto */}
          <div>
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2 block">
              Har Kvitto
            </label>
            <div className="flex flex-wrap gap-2">
              {['all', 'yes', 'no'].map(option => (
                <button
                  key={option}
                  onClick={() => handleFilterChange('hasReceipt', option)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    localFilters.hasReceipt === option
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  {option === 'all' ? 'Alla' : option === 'yes' ? 'Ja' : 'Nej'}
                </button>
              ))}
            </div>
          </div>

          {/* Har Notering */}
          <div>
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2 block">
              Har Notering
            </label>
            <div className="flex flex-wrap gap-2">
              {['all', 'yes', 'no'].map(option => (
                <button
                  key={option}
                  onClick={() => handleFilterChange('hasNote', option)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    localFilters.hasNote === option
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  {option === 'all' ? 'Alla' : option === 'yes' ? 'Ja' : 'Nej'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center flex-shrink-0">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-sm font-medium"
          >
            Återställ
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-sm font-medium"
            >
              Avbryt
            </button>
            <button
              onClick={handleApply}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                hasActiveFilters()
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/20'
                  : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 cursor-not-allowed'
              }`}
              disabled={!hasActiveFilters()}
            >
              Tillämpa Filter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionFilterModal;

