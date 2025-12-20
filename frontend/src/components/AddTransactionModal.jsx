import React, { useState, useRef, useEffect } from 'react';
import { FileText, X, Calendar, DollarSign, Tag, AlertCircle, PiggyBank } from 'lucide-react';
import { api } from '../api';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeButtonClass, getThemeBgClass } from '../utils/getThemeClasses';

const AddTransactionModal = ({ onClose, onSave, categories = [] }) => {
  const { colorTheme, isDarkMode } = useTheme();
  const [formData, setFormData] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    amount: '',
    type: 'expense',
    category: '',
    status: 'Väntar',
    note: '',
    linkToSavings: false,
    savingsType: null, // 'goal' or 'account'
    savingsId: null
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [savingsGoals, setSavingsGoals] = useState([]);
  const [savingsAccounts, setSavingsAccounts] = useState([]);
  const datePickerRef = useRef(null);
  const dateInputRef = useRef(null);

  useEffect(() => {
    // Load savings goals and accounts
    const loadSavings = async () => {
      try {
        const [goals, accounts] = await Promise.all([
          api.getSavingsGoals(),
          api.getSavingsAccounts()
        ]);
        setSavingsGoals(goals.filter(g => g.status === 'Aktiv'));
        setSavingsAccounts(accounts.filter(a => a.status === 'Aktiv'));
      } catch (error) {
        console.error('Error loading savings:', error);
      }
    };
    loadSavings();
  }, []);

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
    
    if (!formData.title.trim()) {
      newErrors.title = 'Beskrivning krävs';
    }
    if (!formData.date) {
      newErrors.date = 'Datum krävs';
    }
    if (!formData.amount || parseFloat(formData.amount) === 0) {
      newErrors.amount = 'Belopp måste vara större än 0';
    }
    if (!formData.category) {
      newErrors.category = 'Kategori krävs';
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
      const transactionData = {
        title: formData.title.trim(),
        date: formData.date,
        amount: formData.type === 'expense' 
          ? -Math.abs(parseFloat(formData.amount))
          : Math.abs(parseFloat(formData.amount)),
        type: formData.type,
        category: formData.category,
        status: formData.status,
        note: formData.note.trim() || null,
        linkToSavings: formData.linkToSavings && formData.savingsId ? {
          type: formData.savingsType,
          id: formData.savingsId
        } : null
      };

      await onSave(transactionData);
      onClose();
    } catch (error) {
      console.error('Error saving transaction:', error);
      setErrors({ submit: error.message || 'Kunde inte spara transaktion' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
              <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Ny Faktura</h2>
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

          {/* Beskrivning */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Beskrivning <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="T.ex. Faktura från leverantör"
              className={`w-full bg-white dark:bg-zinc-800 border rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                errors.title ? 'border-rose-500' : 'border-zinc-200 dark:border-zinc-700'
              }`}
            />
            {errors.title && (
              <p className="mt-1 text-xs text-rose-500">{errors.title}</p>
            )}
          </div>

          {/* Typ & Datum */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                <DollarSign size={14} /> Typ <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleChange('type', e.target.value)}
                className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              >
                <option value="expense">Utgift</option>
                <option value="income">Inkomst</option>
              </select>
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
                  className={`w-full bg-white dark:bg-zinc-800 border rounded-xl px-4 py-3 pr-10 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono ${
                    errors.date ? 'border-rose-500' : 'border-zinc-200 dark:border-zinc-700'
                  }`}
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
              {errors.date && (
                <p className="mt-1 text-xs text-rose-500">{errors.date}</p>
              )}
            </div>
          </div>

          {/* Belopp & Kategori */}
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
                placeholder="0.00"
                className={`w-full bg-white dark:bg-zinc-800 border rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                  errors.amount ? 'border-rose-500' : 'border-zinc-200 dark:border-zinc-700'
                }`}
              />
              {errors.amount && (
                <p className="mt-1 text-xs text-rose-500">{errors.amount}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                <Tag size={14} /> Kategori <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
                className={`w-full bg-white dark:bg-zinc-800 border rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                  errors.category ? 'border-rose-500' : 'border-zinc-200 dark:border-zinc-700'
                }`}
              >
                <option value="">Välj kategori</option>
                {categories.map(cat => {
                  const categoryName = typeof cat === 'string' ? cat : cat.name || cat;
                  return (
                    <option key={categoryName} value={categoryName}>{categoryName}</option>
                  );
                })}
              </select>
              {errors.category && (
                <p className="mt-1 text-xs text-rose-500">{errors.category}</p>
              )}
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
              className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            >
              <option value="Väntar">Väntar</option>
              <option value="Bokförd">Bokförd</option>
              <option value="Granskas">Granskas</option>
            </select>
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
              className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
            />
          </div>

          {/* Link to Savings */}
          {(savingsGoals.length > 0 || savingsAccounts.length > 0) && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                <PiggyBank size={14} /> Koppla till Sparande
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.linkToSavings}
                  onChange={(e) => handleChange('linkToSavings', e.target.checked)}
                  className="w-4 h-4 text-indigo-600 bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600 rounded focus:ring-indigo-500"
                />
                <span className="text-sm text-zinc-700 dark:text-zinc-300">
                  {formData.type === 'income' ? 'Sätta in som sparande' : 'Ta ut från sparande'}
                </span>
              </div>
              {formData.linkToSavings && (
                <select
                  value={formData.savingsType && formData.savingsId ? `${formData.savingsType}_${formData.savingsId}` : ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '') {
                      handleChange('savingsType', null);
                      handleChange('savingsId', null);
                    } else {
                      const [type, id] = value.split('_');
                      handleChange('savingsType', type);
                      handleChange('savingsId', parseInt(id));
                    }
                  }}
                  className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                >
                  <option value="">Välj spar-mål eller konto</option>
                  {savingsAccounts.length > 0 && (
                    <optgroup label="Spar-konton">
                      {savingsAccounts.map(acc => (
                        <option key={`account_${acc.id}`} value={`account_${acc.id}`}>
                          {acc.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {savingsGoals.length > 0 && (
                    <optgroup label="Sparmål">
                      {savingsGoals.map(goal => (
                        <option key={`goal_${goal.id}`} value={`goal_${goal.id}`}>
                          {goal.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              )}
            </div>
          )}

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
              className={`flex-1 px-4 py-3 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 ${getThemeButtonClass(colorTheme, 'primary')}`}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Sparar...
                </>
              ) : (
                'Spara Faktura'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTransactionModal;

