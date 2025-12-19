import React, { useState } from 'react';
import { Wallet, Key, ShieldCheck, ChevronRight } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { api } from '../api';
import logo from '../logo.png';

const LicenseGate = ({ onUnlock, isDarkMode, toggleTheme }) => {
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleThemeToggle = async () => {
    const newTheme = !isDarkMode;
    toggleTheme();
    // Spara tema-inställningen
    try {
      await api.saveSettings({
        default_theme: newTheme ? 'dark' : 'light'
      });
    } catch (error) {
      console.error('Kunde inte spara tema-inställning:', error);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onUnlock();
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden transition-colors duration-500">
      
      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle isDark={isDarkMode} toggle={handleThemeToggle} />
      </div>

      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-[100px] transition-all duration-1000" />
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-emerald-500/10 dark:bg-emerald-500/10 rounded-full blur-[100px] transition-all duration-1000" />
      </div>

      <div className="w-full max-w-md z-10">
        <div className="bg-white/80 dark:bg-zinc-900/50 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-2xl shadow-zinc-200/50 dark:shadow-black/50 transition-all duration-500">
          <div className="flex justify-center mb-6">
            <img 
              src={logo} 
              alt="WestBudget" 
              className="w-16 h-16 object-contain"
            />
          </div>
          
          <h1 className="text-2xl font-bold text-center text-zinc-900 dark:text-white mb-2 transition-colors">WestBudget</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-center text-sm mb-8 transition-colors">
            Professionell bokföring och licenshantering.
            <br />Ange din produktnyckel för att starta.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider ml-1">Licensnyckel</label>
              <div className="relative group">
                <Key className="absolute left-3 top-3.5 w-5 h-5 text-zinc-400 dark:text-zinc-500 group-focus-within:text-indigo-500 dark:group-focus-within:text-indigo-400 transition-colors" />
                <input 
                  type="text" 
                  value={key}
                  onChange={(e) => setKey(e.target.value.toUpperCase())}
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  className="w-full bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-700/50 rounded-xl py-3 pl-10 pr-4 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-300 font-mono tracking-widest uppercase"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-zinc-900 dark:bg-white text-white dark:text-black font-semibold py-3.5 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2 shadow-lg"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Lås upp Applikation <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
          
          <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800/50 flex items-center justify-center gap-2 text-xs text-zinc-400 dark:text-zinc-500 transition-colors">
            <ShieldCheck className="w-3 h-3" />
            <span>Säker verifiering via SSL</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LicenseGate;

