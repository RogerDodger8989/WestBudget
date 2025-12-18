import React, { useState, useRef, useEffect } from 'react';
import { X, DollarSign, Calendar, Tag, FileText, Car, Gauge } from 'lucide-react';
import { formatAmount } from '../utils/formatAmount';

const VehicleExpenseDrawer = ({ expense, onClose, onSave, onDelete, vehicles = [] }) => {
  const [formData, setFormData] = useState({
    vehicle_id: expense?.vehicle_id || '',
    category: expense?.category || '',
    amount: expense?.amount || '',
    date: expense?.date || new Date().toISOString().split('T')[0],
    description: expense?.description || '',
    note: expense?.note || '',
    odometer_at_purchase: expense?.odometer_at_purchase || ''
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const datePickerRef = useRef(null);
  const dateInputRef = useRef(null);

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
    'Bilvård',
    'Bilvask',
    'Övrigt'
  ];

  // Uppdatera state när expense ändras
  useEffect(() => {
    if (expense) {
      setFormData({
        vehicle_id: expense.vehicle_id || '',
        category: expense.category || '',
        amount: expense.amount || '',
        date: expense.date || new Date().toISOString().split('T')[0],
        description: expense.description || '',
        note: expense.note || '',
        odometer_at_purchase: expense.odometer_at_purchase || ''
      });
    }
  }, [expense]);

  // Format date input (YYYY-MM-DD)
  const formatDateInput = (value) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 4) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
    return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
  };

  const handleChange = (field, value) => {
    if (field === 'date') {
      const formatted = formatDateInput(value);
      setFormData(prev => ({ ...prev, [field]: formatted }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(expense.id, {
        vehicle_id: parseInt(formData.vehicle_id),
        category: formData.category,
        amount: parseFloat(formData.amount),
        date: formData.date,
        description: formData.description.trim() || null,
        note: formData.note.trim() || null,
        odometer_at_purchase: formData.odometer_at_purchase ? parseInt(formData.odometer_at_purchase) : null
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    
    const confirmed = window.confirm(`Är du säker på att du vill radera denna kostnad? Detta kan inte ångras.`);
    if (!confirmed) return;
    
    setIsDeleting(true);
    try {
      await onDelete(expense.id);
    } finally {
      setIsDeleting(false);
    }
  };

  // Get selected vehicle for odometer display
  const selectedVehicle = vehicles.find(v => v.id === parseInt(formData.vehicle_id));

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
            <DollarSign className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
              Redigera Fordonskostnad
            </h2>
            {expense && (
              <p className="text-xs text-zinc-500 mt-0.5">
                ID: {expense.id}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-zinc-500" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Fordon */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
            <Car size={14} /> Fordon <span className="text-rose-500">*</span>
          </label>
          <select
            value={formData.vehicle_id}
            onChange={(e) => handleChange('vehicle_id', e.target.value)}
            className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
          >
            <option value="">Välj fordon</option>
            {vehicles.filter(v => v.status === 'Aktiv').map(vehicle => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.make_model} ({vehicle.registration_number})
              </option>
            ))}
          </select>
          {selectedVehicle && (
            <p className="text-xs text-zinc-500 mt-1">
              Nuvarande mätarställning: {selectedVehicle.odometer || 0} mil
            </p>
          )}
        </div>

        {/* Kategori */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
            <Tag size={14} /> Kategori <span className="text-rose-500">*</span>
          </label>
          <select
            value={formData.category}
            onChange={(e) => handleChange('category', e.target.value)}
            className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
          >
            <option value="">Välj kategori</option>
            {expenseCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Belopp & Datum */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
              <DollarSign size={14} /> Belopp (kr) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) => handleChange('amount', e.target.value)}
              className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
              <Calendar size={14} className="text-indigo-500 dark:text-indigo-400" /> Datum <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                ref={dateInputRef}
                value={formData.date}
                onChange={(e) => handleChange('date', e.target.value)}
                placeholder="YYYY-MM-DD"
                maxLength={10}
                className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 pr-10 text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none font-mono"
              />
              <input
                ref={datePickerRef}
                type="date"
                value={formData.date}
                onChange={(e) => handleChange('date', e.target.value)}
                className="absolute opacity-0 pointer-events-none"
                style={{ width: 0, height: 0 }}
              />
              <button
                type="button"
                onClick={() => datePickerRef.current?.showPicker?.() || datePickerRef.current?.click()}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded transition-colors"
              >
                <Calendar size={18} className="text-indigo-500 dark:text-indigo-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Mätarställning vid köp (valfritt) */}
        {formData.category === 'Drivmedel' && (
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
              <Gauge size={14} /> Mätarställning vid köp (mil)
            </label>
            <input
              type="number"
              min="0"
              value={formData.odometer_at_purchase}
              onChange={(e) => handleChange('odometer_at_purchase', e.target.value)}
              placeholder="Valfritt för drivmedel"
              className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
            <p className="text-xs text-zinc-500">
              Användbart för att spåra bränsleförbrukning
            </p>
          </div>
        )}

        {/* Beskrivning */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Beskrivning
          </label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Beskriv kostnaden..."
            className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
          />
        </div>

        {/* Noteringar */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
            <FileText size={14} /> Noteringar
          </label>
          <textarea
            value={formData.note}
            onChange={(e) => handleChange('note', e.target.value)}
            placeholder="Lägg till noteringar..."
            rows={3}
            className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 flex gap-3 flex-shrink-0">
        <button
          onClick={handleDelete}
          disabled={isSaving || isDeleting}
          className="p-3 bg-rose-100 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-xl hover:bg-rose-200 dark:hover:bg-rose-900/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Radera kostnad"
        >
          <X className="w-5 h-5" />
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving || isDeleting}
          className="flex-1 bg-zinc-900 dark:bg-white text-white dark:text-black font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Sparar...' : 'Spara Ändringar'}
        </button>
      </div>
    </div>
  );
};

export default VehicleExpenseDrawer;

