import React, { useState } from 'react';
import { X, SlidersHorizontal } from 'lucide-react';

const VehicleExpenseFilterModal = ({ 
  isOpen, 
  onClose, 
  vehicles = [],
  filters, 
  onFiltersChange 
}) => {
  const [localFilters, setLocalFilters] = useState(filters || {
    vehicle: 'all',
    category: 'all',
    minAmount: '',
    maxAmount: ''
  });

  if (!isOpen) return null;

  const expenseCategories = [
    'Drivmedel',
    'Reparationer',
    'Service & Underhåll',
    'Däckhotell',
    'Försäkring',
    'Besiktning',
    'Parkering',
    'Vinterdäck',
    'Sommardäck',
    'Övrigt'
  ];

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
      vehicle: 'all',
      category: 'all',
      minAmount: '',
      maxAmount: ''
    };
    setLocalFilters(resetFilters);
    onFiltersChange(resetFilters);
    onClose();
  };

  const hasActiveFilters = () => {
    return localFilters.vehicle !== 'all' ||
           localFilters.category !== 'all' ||
           localFilters.minAmount !== '' ||
           localFilters.maxAmount !== '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between flex-shrink-0">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <SlidersHorizontal size={18} className="text-indigo-500" />
            Filtrera Fordonskostnader
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
            <X size={20} className="text-zinc-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0">
          {/* Fordon Filter */}
          <div>
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2 block">
              Fordon
            </label>
            <select
              value={localFilters.vehicle}
              onChange={(e) => handleFilterChange('vehicle', e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Alla fordon</option>
              {vehicles.filter(v => v.status === 'Aktiv').map(vehicle => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.make_model} ({vehicle.registration_number})
                </option>
              ))}
            </select>
          </div>

          {/* Kategori Filter */}
          <div>
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2 block">
              Kategori
            </label>
            <select
              value={localFilters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Alla kategorier</option>
              {expenseCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Belopp Range */}
          <div>
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2 block">
              Belopp (kr)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Min</label>
                <input
                  type="number"
                  value={localFilters.minAmount}
                  onChange={(e) => handleFilterChange('minAmount', e.target.value)}
                  placeholder="0"
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Max</label>
                <input
                  type="number"
                  value={localFilters.maxAmount}
                  onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
                  placeholder="Ingen gräns"
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 flex gap-3">
          <button
            onClick={handleReset}
            className="flex-1 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
          >
            Rensa
          </button>
          <button
            onClick={handleApply}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-500 transition-all"
          >
            Applicera
          </button>
        </div>
      </div>
    </div>
  );
};

export default VehicleExpenseFilterModal;

