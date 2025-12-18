import React, { useState } from 'react';
import { Filter, X, SlidersHorizontal } from 'lucide-react';

const AgreementFilterModal = ({ 
  isOpen, 
  onClose, 
  categories, 
  filters, 
  onFiltersChange 
}) => {
  const [localFilters, setLocalFilters] = useState(filters || {
    status: 'all',
    category: 'all',
    frequency: 'all',
    hasImages: 'all',
    hasNotice: 'all',
    minCost: '',
    maxCost: ''
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
      status: 'all',
      category: 'all',
      frequency: 'all',
      hasImages: 'all',
      hasNotice: 'all',
      minCost: '',
      maxCost: ''
    };
    setLocalFilters(resetFilters);
    onFiltersChange(resetFilters);
    onClose();
  };

  const hasActiveFilters = () => {
    return localFilters.status !== 'all' ||
           localFilters.category !== 'all' ||
           localFilters.frequency !== 'all' ||
           localFilters.hasImages !== 'all' ||
           localFilters.hasNotice !== 'all' ||
           localFilters.minCost !== '' ||
           localFilters.maxCost !== '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <SlidersHorizontal size={18} className="text-indigo-500" />
            Filtrera Avtal
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
            <X size={20} className="text-zinc-500" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
          {/* Status Filter */}
          <div>
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2 block">
              Status
            </label>
            <div className="flex flex-wrap gap-2">
              {['all', 'Aktiv', 'Pausad', 'Uppsagd'].map(status => (
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

          {/* Kategori Filter */}
          <div>
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2 block">
              Kategori
            </label>
            <select
              value={localFilters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-4 py-2 text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Alla Kategorier</option>
              {categories && categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Frekvens Filter */}
          <div>
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2 block">
              Betalningsfrekvens
            </label>
            <select
              value={localFilters.frequency}
              onChange={(e) => handleFilterChange('frequency', e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-4 py-2 text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Alla Frekvenser</option>
              <option value="Månadsvis">Månadsvis</option>
              <option value="Årlig">Årlig</option>
              <option value="Kvartalsvis">Kvartalsvis</option>
              <option value="Halvårlig">Halvårlig</option>
            </select>
          </div>

          {/* Kostnad Range */}
          <div>
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2 block">
              Kostnad (kr)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input
                  type="number"
                  placeholder="Min"
                  value={localFilters.minCost}
                  onChange={(e) => handleFilterChange('minCost', e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-4 py-2 text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <input
                  type="number"
                  placeholder="Max"
                  value={localFilters.maxCost}
                  onChange={(e) => handleFilterChange('maxCost', e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-4 py-2 text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Har Bild */}
          <div>
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2 block">
              Har Bild
            </label>
            <div className="flex gap-2">
              {['all', 'yes', 'no'].map(option => (
                <button
                  key={option}
                  onClick={() => handleFilterChange('hasImages', option)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    localFilters.hasImages === option
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
            <div className="flex gap-2">
              {['all', 'yes', 'no'].map(option => (
                <button
                  key={option}
                  onClick={() => handleFilterChange('hasNotice', option)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    localFilters.hasNotice === option
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

        <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 flex justify-between gap-3">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-zinc-600 dark:text-zinc-300 font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            Återställ
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-zinc-600 dark:text-zinc-300 font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              Avbryt
            </button>
            <button
              onClick={handleApply}
              className={`px-6 py-2 font-semibold rounded-lg shadow-lg transition-all ${
                hasActiveFilters()
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20'
                  : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-500 cursor-not-allowed'
              }`}
              disabled={!hasActiveFilters()}
            >
              Applicera Filter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgreementFilterModal;

