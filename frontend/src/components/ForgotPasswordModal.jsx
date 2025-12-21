import React, { useState } from 'react';
import { X, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { api } from '../api';
import { useToast } from '../contexts/ToastContext';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeButtonClass, getThemeRingClass } from '../utils/getThemeClasses';

const ForgotPasswordModal = ({ isOpen, onClose, onSwitchToLogin }) => {
  const { showToast } = useToast();
  const { colorTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      showToast('Vänligen ange din e-postadress', { type: 'error' });
      return;
    }

    setLoading(true);
    try {
      await api.forgotPassword(email);
      setSent(true);
      showToast('Återställningslänk har skickats till din e-post', { type: 'success' });
    } catch (error) {
      showToast(error.message || 'Kunde inte skicka återställningslänk', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
              Glömt lösenord?
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Vi skickar en återställningslänk till din e-post
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
          >
            <X size={20} className="text-zinc-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {sent ? (
            <div className="text-center py-8">
              <div className="mx-auto w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="text-emerald-600 dark:text-emerald-400" size={32} />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
                E-post skickad!
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
                Vi har skickat en återställningslänk till <strong>{email}</strong>. 
                Kontrollera din inkorg och följ instruktionerna.
              </p>
              <button
                onClick={onSwitchToLogin}
                className={`px-6 py-2 ${getThemeButtonClass(colorTheme, 'primary')} rounded-xl font-medium transition-all`}
              >
                Tillbaka till inloggning
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2 block">
                  E-postadress
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" size={18} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="din@epost.se"
                    disabled={loading}
                    className={`w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 ${getThemeRingClass(colorTheme)} disabled:opacity-50`}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 ${getThemeButtonClass(colorTheme, 'primary')} rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading ? 'Skickar...' : 'Skicka återställningslänk'}
              </button>

              <button
                type="button"
                onClick={onSwitchToLogin}
                className="w-full flex items-center justify-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
              >
                <ArrowLeft size={16} />
                Tillbaka till inloggning
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordModal;

