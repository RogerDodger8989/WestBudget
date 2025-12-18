import React, { useState, useRef } from 'react';
import { DollarSign, X, Calendar, Tag, FileText, AlertCircle, Car, Gauge } from 'lucide-react';
import { api } from '../api';

const AddVehicleExpenseModal = ({ onClose, onSave, vehicles = [], vehicleId = null }) => {
  const [formData, setFormData] = useState({
    vehicle_id: vehicleId || '',
    category: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    note: '',
    odometer_at_purchase: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
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
    // Rensa fel för detta fält
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.vehicle_id) {
      newErrors.vehicle_id = 'Fordon krävs';
    }
    if (!formData.category) {
      newErrors.category = 'Kategori krävs';
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Belopp måste vara större än 0';
    }
    if (!formData.date) {
      newErrors.date = 'Datum krävs';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const expenseData = {
        vehicle_id: parseInt(formData.vehicle_id),
        category: formData.category,
        amount: parseFloat(formData.amount),
        date: formData.date,
        description: formData.description.trim() || null,
        note: formData.note.trim() || null,
        odometer_at_purchase: formData.odometer_at_purchase ? parseInt(formData.odometer_at_purchase) : null
      };

      await onSave(expenseData);
      onClose();
    } catch (error) {
      console.error('Error saving vehicle expense:', error);
      setErrors({ submit: error.message || 'Kunde inte spara kostnad' });
    } finally {
      setLoading(false);
    }
  };

  // Get selected vehicle for odometer display
  const selectedVehicle = vehicles.find(v => v.id === parseInt(formData.vehicle_id));

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
              <DollarSign className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Lägg till Fordonskostnad</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-zinc-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errors.submit && (
            <div className="p-3 bg-rose-100 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-2 text-rose-700 dark:text-rose-400">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{errors.submit}</span>
            </div>
          )}

          {/* Fordon */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              <Car className="w-4 h-4 inline mr-1" />
              Fordon <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.vehicle_id}
              onChange={(e) => handleChange('vehicle_id', e.target.value)}
              className={`w-full bg-zinc-50 dark:bg-zinc-800 border rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                errors.vehicle_id ? 'border-rose-500' : 'border-zinc-200 dark:border-zinc-700'
              }`}
            >
              <option value="">Välj fordon</option>
              {vehicles.filter(v => v.status === 'Aktiv').map(vehicle => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.make_model} ({vehicle.registration_number})
                </option>
              ))}
            </select>
            {errors.vehicle_id && (
              <p className="mt-1 text-xs text-rose-500">{errors.vehicle_id}</p>
            )}
            {selectedVehicle && (
              <p className="mt-1 text-xs text-zinc-500">
                Nuvarande mätarställning: {selectedVehicle.odometer || 0} mil
              </p>
            )}
          </div>

          {/* Kategori */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              <Tag className="w-4 h-4 inline mr-1" />
              Kategori <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
              className={`w-full bg-zinc-50 dark:bg-zinc-800 border rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                errors.category ? 'border-rose-500' : 'border-zinc-200 dark:border-zinc-700'
              }`}
            >
              <option value="">Välj kategori</option>
              {expenseCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {errors.category && (
              <p className="mt-1 text-xs text-rose-500">{errors.category}</p>
            )}
          </div>

          {/* Belopp & Datum */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Belopp (kr) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => handleChange('amount', e.target.value)}
                placeholder="0.00"
                className={`w-full bg-zinc-50 dark:bg-zinc-800 border rounded-xl px-4 py-3 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                  errors.amount ? 'border-rose-500' : 'border-zinc-200 dark:border-zinc-700'
                }`}
              />
              {errors.amount && (
                <p className="mt-1 text-xs text-rose-500">{errors.amount}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                <Calendar className="w-4 h-4 inline mr-1 text-indigo-500 dark:text-indigo-400" />
                Datum <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  ref={dateInputRef}
                  value={formData.date}
                  onChange={(e) => handleChange('date', e.target.value)}
                  placeholder="YYYY-MM-DD"
                  maxLength={10}
                  className={`w-full bg-zinc-50 dark:bg-zinc-800 border rounded-xl px-4 py-3 pl-10 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono ${
                    errors.date ? 'border-rose-500' : 'border-zinc-200 dark:border-zinc-700'
                  }`}
                />
                <input
                  type="date"
                  ref={datePickerRef}
                  value={formData.date}
                  onChange={(e) => {
                    if (e.target.value) {
                      handleChange('date', e.target.value);
                    }
                  }}
                  className="absolute opacity-0 pointer-events-none"
                />
                <Calendar
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500 dark:text-indigo-400 cursor-pointer"
                  onClick={() => datePickerRef.current?.showPicker()}
                />
              </div>
              {errors.date && (
                <p className="mt-1 text-xs text-rose-500">{errors.date}</p>
              )}
            </div>
          </div>

          {/* Mätarställning vid köp (valfritt) */}
          {formData.category === 'Drivmedel' && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                <Gauge className="w-4 h-4 inline mr-1" />
                Mätarställning vid köp (mil)
              </label>
              <input
                type="number"
                min="0"
                value={formData.odometer_at_purchase}
                onChange={(e) => handleChange('odometer_at_purchase', e.target.value)}
                placeholder="Valfritt för drivmedel"
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
              <p className="mt-1 text-xs text-zinc-500">
                Användbart för att spåra bränsleförbrukning
              </p>
            </div>
          )}

          {/* Beskrivning */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Beskrivning
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Beskriv kostnaden..."
              className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>

          {/* Noteringar */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              <FileText className="w-4 h-4 inline mr-1" />
              Noteringar
            </label>
            <textarea
              value={formData.note}
              onChange={(e) => handleChange('note', e.target.value)}
              placeholder="Lägg till noteringar..."
              rows={3}
              className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
            >
              Avbryt
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Sparar...
                </>
              ) : (
                'Spara Kostnad'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddVehicleExpenseModal;

