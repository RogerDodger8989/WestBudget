import React, { useState } from 'react';
import { CreditCard, Check, ArrowRight, Loader2 } from 'lucide-react';
import { api } from '../api';
import { useToast } from '../contexts/ToastContext';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeButtonClass } from '../utils/getThemeClasses';

const UpgradeToPremium = ({ onUpgrade }) => {
  const { showToast } = useToast();
  const { colorTheme } = useTheme();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const result = await api.createCheckoutSession();
      // Redirect to Stripe Checkout
      window.location.href = result.url;
    } catch (error) {
      showToast(error.message || 'Kunde inte skapa betalningssession', { type: 'error' });
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200 dark:border-indigo-800 rounded-2xl">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
          <CreditCard className="text-indigo-600 dark:text-indigo-400" size={24} />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
            Uppgradera till Premium
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
            Få tillgång till alla funktioner utan tidsbegränsning
          </p>
          
          <div className="space-y-2 mb-6">
            <div className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
              <Check className="text-emerald-500" size={16} />
              <span>Obegränsad användning</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
              <Check className="text-emerald-500" size={16} />
              <span>Alla funktioner aktiverade</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
              <Check className="text-emerald-500" size={16} />
              <span>Prioriterad support</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
              <Check className="text-emerald-500" size={16} />
              <span>Automatiska uppdateringar</span>
            </div>
          </div>

          <button
            onClick={handleUpgrade}
            disabled={loading}
            className={`w-full py-3 ${getThemeButtonClass(colorTheme, 'primary')} rounded-xl font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Skapar betalningssession...
              </>
            ) : (
              <>
                Uppgradera nu
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpgradeToPremium;

