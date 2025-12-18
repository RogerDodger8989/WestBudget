import React, { useState, useEffect } from 'react';
import { FileText, X, Calendar, DollarSign, Tag, AlertCircle } from 'lucide-react';

const AddAgreementModal = ({ onClose, onSave, categories = [] }) => {
  const [formData, setFormData] = useState({
    name: '',
    provider: '',
    cost: '',
    frequency: 'Månadsvis',
    startDate: new Date().toISOString().split('T')[0], // Idag som default
    status: 'Aktiv',
    category: categories[0] || '',
    icon: '📄',
    notice: ''
  });

  const [errors, setErrors] = useState({});

  // Beräkna nästa betalning baserat på startdatum och frekvens
  const calculateNextPayment = (startDate, frequency) => {
    if (!startDate) return '';
    
    const date = new Date(startDate);
    
    switch (frequency) {
      case 'Månadsvis':
        date.setMonth(date.getMonth() + 1);
        break;
      case 'Kvartalsvis':
        date.setMonth(date.getMonth() + 3);
        break;
      case 'Årligen':
        date.setFullYear(date.getFullYear() + 1);
        break;
      default:
        return '';
    }
    
    return date.toISOString().split('T')[0];
  };

  // Uppdatera nästa betalning när startdatum eller frekvens ändras
  useEffect(() => {
    if (formData.startDate && formData.frequency) {
      const nextPayment = calculateNextPayment(formData.startDate, formData.frequency);
      // Vi behåller nextPayment i formData men visar den beräknade
    }
  }, [formData.startDate, formData.frequency]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Rensa fel för detta fält
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = 'Tjänstnamn krävs';
    if (!formData.provider.trim()) newErrors.provider = 'Leverantör krävs';
    if (!formData.cost || parseFloat(formData.cost) <= 0) {
      newErrors.cost = 'Kostnad måste vara större än 0';
    }
    if (!formData.startDate) newErrors.startDate = 'Startdatum krävs';
    if (!formData.category) newErrors.category = 'Kategori krävs';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const nextPayment = calculateNextPayment(formData.startDate, formData.frequency);
    
    const agreementData = {
      name: formData.name.trim(),
      provider: formData.provider.trim(),
      cost: parseFloat(formData.cost),
      frequency: formData.frequency,
      next_payment: nextPayment,
      status: formData.status,
      category: formData.category,
      icon: formData.icon || '📄',
      notice: formData.notice.trim()
    };

    await onSave(agreementData);
  };

  const iconOptions = [
    '🏠', '🚗', '📱', '💻', '🎵', '💪', '🏢', '📊', 
    '🔒', '🌐', '📺', '☕', '🍔', '✈️', '🏥', '🎓'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <FileText size={20} className="text-indigo-500" />
            Lägg till Nytt Avtal
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
            <X size={20} className="text-zinc-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Tjänst & Leverantör */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                <FileText size={14} /> Tjänst / Namn *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="T.ex. Spotify Premium"
                className={`w-full bg-zinc-50 dark:bg-zinc-800 border rounded-xl px-4 py-3 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.name ? 'border-rose-500' : 'border-zinc-200 dark:border-zinc-700'
                }`}
                autoFocus
              />
              {errors.name && (
                <p className="text-xs text-rose-500 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.name}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                <FileText size={14} /> Leverantör / Företag *
              </label>
              <input
                type="text"
                value={formData.provider}
                onChange={(e) => handleChange('provider', e.target.value)}
                placeholder="T.ex. Spotify"
                className={`w-full bg-zinc-50 dark:bg-zinc-800 border rounded-xl px-4 py-3 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.provider ? 'border-rose-500' : 'border-zinc-200 dark:border-zinc-700'
                }`}
              />
              {errors.provider && (
                <p className="text-xs text-rose-500 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.provider}
                </p>
              )}
            </div>
          </div>

          {/* Kostnad & Frekvens */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                <DollarSign size={14} /> Kostnad per Månad (kr) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.cost}
                onChange={(e) => handleChange('cost', e.target.value)}
                placeholder="0.00"
                className={`w-full bg-zinc-50 dark:bg-zinc-800 border rounded-xl px-4 py-3 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.cost ? 'border-rose-500' : 'border-zinc-200 dark:border-zinc-700'
                }`}
              />
              {errors.cost && (
                <p className="text-xs text-rose-500 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.cost}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                <Calendar size={14} /> Betalningsfrekvens *
              </label>
              <select
                value={formData.frequency}
                onChange={(e) => handleChange('frequency', e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Månadsvis">Månadsvis</option>
                <option value="Kvartalsvis">Kvartalsvis</option>
                <option value="Årligen">Årligen</option>
              </select>
            </div>
          </div>

          {/* Startdatum & Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                <Calendar size={14} /> Startdatum *
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
                className={`w-full bg-zinc-50 dark:bg-zinc-800 border rounded-xl px-4 py-3 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.startDate ? 'border-rose-500' : 'border-zinc-200 dark:border-zinc-700'
                }`}
              />
              {errors.startDate && (
                <p className="text-xs text-rose-500 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.startDate}
                </p>
              )}
              {formData.startDate && formData.frequency && (
                <p className="text-xs text-zinc-500">
                  Nästa betalning: {calculateNextPayment(formData.startDate, formData.frequency)}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                <Tag size={14} /> Status *
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Aktiv">Aktiv</option>
                <option value="Uppsagd">Uppsagd</option>
                <option value="Väntar på motpart">Väntar på motpart</option>
              </select>
            </div>
          </div>

          {/* Kategori & Ikon */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                <Tag size={14} /> Kategori *
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
                className={`w-full bg-zinc-50 dark:bg-zinc-800 border rounded-xl px-4 py-3 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.category ? 'border-rose-500' : 'border-zinc-200 dark:border-zinc-700'
                }`}
              >
                <option value="">Välj kategori...</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              {errors.category && (
                <p className="text-xs text-rose-500 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.category}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Ikon (Emoji)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => handleChange('icon', e.target.value)}
                  maxLength={2}
                  placeholder="📄"
                  className="w-20 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-2xl text-center outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <div className="flex-1 flex flex-wrap gap-1">
                  {iconOptions.slice(0, 8).map(icon => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => handleChange('icon', icon)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg transition-all ${
                        formData.icon === icon
                          ? 'bg-indigo-100 dark:bg-indigo-900/30 border-2 border-indigo-500'
                          : 'bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-indigo-500'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Notis */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              Notis / Kommentar
            </label>
            <textarea
              value={formData.notice}
              onChange={(e) => handleChange('notice', e.target.value)}
              placeholder="T.ex. 'Förnyas 2025-04-01' eller 'Bindningstid slut'"
              rows={3}
              className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-zinc-600 dark:text-zinc-300 font-medium hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              Avbryt
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-lg shadow-indigo-500/20 transition-all"
            >
              Spara Avtal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAgreementModal;

