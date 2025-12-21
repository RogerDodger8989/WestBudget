import React, { useState } from 'react';
import { X, Mail, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeButtonClass, getThemeRingClass, getThemeTextClass } from '../utils/getThemeClasses';

const RegisterModal = ({ isOpen, onClose, onSwitchToLogin }) => {
  const { register } = useAuth();
  const { showToast } = useToast();
  const { colorTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const validatePassword = (pwd) => {
    if (pwd.length < 8) return 'Lösenordet måste vara minst 8 tecken';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password || !confirmPassword) {
      showToast('Vänligen fyll i alla fält', { type: 'error' });
      return;
    }

    if (password !== confirmPassword) {
      showToast('Lösenorden matchar inte', { type: 'error' });
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      showToast(passwordError, { type: 'error' });
      return;
    }

    if (!acceptedTerms) {
      showToast('Du måste acceptera villkoren', { type: 'error' });
      return;
    }

    setLoading(true);
    try {
      await register(email, password);
      showToast('Konto skapat! Du har nu 30 dagars provperiod.', { type: 'success' });
      onClose();
      // Reset form
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setAcceptedTerms(false);
    } catch (error) {
      showToast(error.message || 'Registrering misslyckades', { type: 'error' });
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
              Skapa konto
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Börja din 30-dagars provperiod
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
          >
            <X size={20} className="text-zinc-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Email */}
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

          {/* Password */}
          <div>
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2 block">
              Lösenord
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" size={18} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minst 8 tecken"
                disabled={loading}
                className={`w-full pl-10 pr-12 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 ${getThemeRingClass(colorTheme)} disabled:opacity-50`}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {password && validatePassword(password) && (
              <p className="text-xs text-rose-500 mt-1">{validatePassword(password)}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2 block">
              Bekräfta lösenord
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" size={18} />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Upprepa lösenordet"
                disabled={loading}
                className={`w-full pl-10 pr-12 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 ${getThemeRingClass(colorTheme)} disabled:opacity-50`}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {confirmPassword && password !== confirmPassword && (
              <p className="text-xs text-rose-500 mt-1">Lösenorden matchar inte</p>
            )}
          </div>

          {/* Terms */}
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className={`mt-1 w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 ${getThemeTextClass(colorTheme, false)} ${getThemeRingClass(colorTheme)}`}
            />
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              Jag accepterar{' '}
              <a href="#" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                användarvillkoren
              </a>{' '}
              och{' '}
              <a href="#" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                integritetspolicyn
              </a>
            </span>
          </label>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 ${getThemeButtonClass(colorTheme, 'primary')} rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? 'Skapar konto...' : 'Skapa konto'}
          </button>

          {/* Switch to login */}
          <div className="text-center pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Har du redan ett konto?{' '}
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
              >
                Logga in
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterModal;

