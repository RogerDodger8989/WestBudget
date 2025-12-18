import React, { useState, useRef } from 'react';
import { X, Calendar } from 'lucide-react';

const CustomDateRangeModal = ({ isOpen, onClose, onApply, currentStartDate, currentEndDate }) => {
  const [startDate, setStartDate] = useState(currentStartDate || '');
  const [endDate, setEndDate] = useState(currentEndDate || '');
  const startDatePickerRef = useRef(null);
  const endDatePickerRef = useRef(null);

  if (!isOpen) return null;

  const handleApply = () => {
    if (startDate && endDate) {
      onApply(startDate, endDate);
      onClose();
    }
  };

  const handleClear = () => {
    setStartDate('');
    setEndDate('');
    onApply(null, null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl">
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Välj Datumperiod</h2>
          <button 
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Från datum */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
              <Calendar size={16} className="text-indigo-500 dark:text-indigo-400" />
              Från datum
            </label>
            <div className="relative">
              <input
                ref={startDatePickerRef}
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* Till datum */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
              <Calendar size={16} className="text-indigo-500 dark:text-indigo-400" />
              Till datum
            </label>
            <div className="relative">
              <input
                ref={endDatePickerRef}
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || undefined}
                className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* Validering */}
          {startDate && endDate && new Date(startDate) > new Date(endDate) && (
            <div className="p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl text-sm text-rose-700 dark:text-rose-300">
              Startdatum måste vara före slutdatum
            </div>
          )}

          {/* Knappar */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleClear}
              className="flex-1 px-4 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors font-medium"
            >
              Rensa
            </button>
            <button
              onClick={handleApply}
              disabled={!startDate || !endDate || new Date(startDate) > new Date(endDate)}
              className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Applicera
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomDateRangeModal;

