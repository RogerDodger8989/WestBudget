import React, { useState, useRef } from 'react';
import { Car, X, Calendar, Gauge, AlertCircle, FileText } from 'lucide-react';
import { api } from '../api';

const AddVehicleModal = ({ onClose, onSave, agreements = [] }) => {
  const [formData, setFormData] = useState({
    registration_number: '',
    make_model: '',
    odometer: '',
    next_inspection: '',
    insurance_company: '',
    insurance_type: '',
    status: 'Aktiv',
    category: 'Personbil',
    note: '',
    agreement_id: '', // Link to insurance agreement
    next_service_odometer: '',
    next_service_date: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const inspectionDateRef = useRef(null);
  const serviceDateRef = useRef(null);
  const inspectionDatePickerRef = useRef(null);
  const serviceDatePickerRef = useRef(null);

  // Format date input (YYYY-MM-DD)
  const formatDateInput = (value) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 4) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
    return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
  };

  const handleChange = (field, value) => {
    if (field === 'next_inspection' || field === 'next_service_date') {
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
    
    if (!formData.registration_number.trim()) {
      newErrors.registration_number = 'Registreringsnummer krävs';
    }
    if (!formData.make_model.trim()) {
      newErrors.make_model = 'Märke/Modell krävs';
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
      const vehicleData = {
        registration_number: formData.registration_number.trim().toUpperCase(),
        make_model: formData.make_model.trim(),
        odometer: formData.odometer ? parseInt(formData.odometer) : 0,
        next_inspection: formData.next_inspection || null,
        status: formData.status,
        category: formData.category,
        note: formData.note.trim() || null,
        agreement_id: formData.agreement_id ? parseInt(formData.agreement_id) : null,
        next_service_odometer: formData.next_service_odometer ? parseInt(formData.next_service_odometer) : null,
        next_service_date: formData.next_service_date || null
      };

      await onSave(vehicleData);
      onClose();
    } catch (error) {
      console.error('Error saving vehicle:', error);
      setErrors({ submit: error.message || 'Kunde inte spara fordon' });
    } finally {
      setLoading(false);
    }
  };

  // Filter agreements to only show insurance-related ones
  const insuranceAgreements = agreements.filter(a => 
    a.category === 'Försäkring' && a.status === 'Aktiv'
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
              <Car className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Lägg till Fordon</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-zinc-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0">
          {errors.submit && (
            <div className="p-3 bg-rose-100 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-2 text-rose-700 dark:text-rose-400">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{errors.submit}</span>
            </div>
          )}

          {/* Registreringsnummer */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Registreringsnummer <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.registration_number}
              onChange={(e) => handleChange('registration_number', e.target.value.toUpperCase())}
              placeholder="ABC 123"
              className={`w-full bg-zinc-50 dark:bg-zinc-800 border rounded-xl px-4 py-3 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                errors.registration_number ? 'border-rose-500' : 'border-zinc-200 dark:border-zinc-700'
              }`}
            />
            {errors.registration_number && (
              <p className="mt-1 text-xs text-rose-500">{errors.registration_number}</p>
            )}
          </div>

          {/* Märke/Modell */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Märke/Modell <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.make_model}
              onChange={(e) => handleChange('make_model', e.target.value)}
              placeholder="Volvo XC60"
              className={`w-full bg-zinc-50 dark:bg-zinc-800 border rounded-xl px-4 py-3 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                errors.make_model ? 'border-rose-500' : 'border-zinc-200 dark:border-zinc-700'
              }`}
            />
            {errors.make_model && (
              <p className="mt-1 text-xs text-rose-500">{errors.make_model}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Mätarställning */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                <Gauge className="w-4 h-4 inline mr-1" />
                Mätarställning (mil)
              </label>
              <input
                type="number"
                value={formData.odometer}
                onChange={(e) => handleChange('odometer', e.target.value)}
                placeholder="0"
                min="0"
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>

            {/* Kategori */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Kategori
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              >
                <option value="Personbil">Personbil</option>
                <option value="Firmabil">Firmabil</option>
                <option value="Motorcykel">Motorcykel</option>
                <option value="Lastbil">Lastbil</option>
                <option value="Övrigt">Övrigt</option>
              </select>
            </div>
          </div>

          {/* Nästa besiktning */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              <Calendar className="w-4 h-4 inline mr-1 text-indigo-500 dark:text-indigo-400" />
              Nästa besiktning
            </label>
            <div className="relative">
              <input
                type="text"
                ref={inspectionDateRef}
                value={formData.next_inspection}
                onChange={(e) => handleChange('next_inspection', e.target.value)}
                placeholder="YYYY-MM-DD"
                maxLength={10}
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 pl-10 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
              <input
                type="date"
                ref={inspectionDatePickerRef}
                onChange={(e) => {
                  if (e.target.value) {
                    handleChange('next_inspection', e.target.value);
                  }
                }}
                className="absolute opacity-0 pointer-events-none"
              />
              <Calendar
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500 dark:text-indigo-400 cursor-pointer"
                onClick={() => inspectionDatePickerRef.current?.showPicker()}
              />
            </div>
          </div>

          {/* Koppla till avtal (försäkring) */}
          {insuranceAgreements.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Koppla till försäkringsavtal
              </label>
              <select
                value={formData.agreement_id}
                onChange={(e) => handleChange('agreement_id', e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              >
                <option value="">Ingen koppling</option>
                {insuranceAgreements.map(agreement => (
                  <option key={agreement.id} value={agreement.id}>
                    {agreement.name} - {agreement.provider} ({agreement.cost} kr/{agreement.frequency.toLowerCase()})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Nästa service */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Nästa service (mätarställning)
              </label>
              <input
                type="number"
                value={formData.next_service_odometer}
                onChange={(e) => handleChange('next_service_odometer', e.target.value)}
                placeholder="mil"
                min="0"
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                <Calendar className="w-4 h-4 inline mr-1 text-indigo-500 dark:text-indigo-400" />
                Nästa service (datum)
              </label>
              <div className="relative">
                <input
                  type="text"
                  ref={serviceDateRef}
                  value={formData.next_service_date}
                  onChange={(e) => handleChange('next_service_date', e.target.value)}
                  placeholder="YYYY-MM-DD"
                  maxLength={10}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 pl-10 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
                <input
                  type="date"
                  ref={serviceDatePickerRef}
                  onChange={(e) => {
                    if (e.target.value) {
                      handleChange('next_service_date', e.target.value);
                    }
                  }}
                  className="absolute opacity-0 pointer-events-none"
                />
                <Calendar
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500 dark:text-indigo-400 cursor-pointer"
                  onClick={() => serviceDatePickerRef.current?.showPicker()}
                />
              </div>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            >
              <option value="Aktiv">Aktiv</option>
              <option value="Inaktiv">Inaktiv</option>
              <option value="Såld">Såld</option>
            </select>
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
              placeholder="Lägg till noteringar om fordonet..."
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
                'Spara Fordon'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddVehicleModal;

