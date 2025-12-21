import React, { useState, useEffect } from 'react';
import { X, Palette, Check } from 'lucide-react';
import { themes, applyTheme, getCurrentTheme } from '../utils/themes';
import { useTheme } from '../contexts/ThemeContext';
import { api } from '../api';
import { useToast } from '../contexts/ToastContext';

const ThemeCustomizer = ({ isOpen, onClose, currentTheme, onThemeChange, isDarkMode, toggleTheme, defaultTheme, onSave }) => {
  const { colorTheme, changeTheme } = useTheme();
  const { showToast } = useToast();
  const [selectedTheme, setSelectedTheme] = useState(currentTheme || colorTheme || 'indigo');
  const [localDarkMode, setLocalDarkMode] = useState(isDarkMode);
  const [originalTheme, setOriginalTheme] = useState(null);
  const [originalDarkMode, setOriginalDarkMode] = useState(null);
  const [customThemes, setCustomThemes] = useState([]);
  const [customPrimaryColor, setCustomPrimaryColor] = useState('#6366f1');
  const [customSecondaryColor, setCustomSecondaryColor] = useState('#818cf8');
  const [customAccentColor, setCustomAccentColor] = useState('#a5b4fc');
  const [customThemeName, setCustomThemeName] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const initialTheme = currentTheme || colorTheme || getCurrentTheme();
      setSelectedTheme(initialTheme);
      setLocalDarkMode(isDarkMode);
      // Save original values for cancel functionality
      setOriginalTheme(initialTheme);
      setOriginalDarkMode(isDarkMode);
      loadCustomThemes();
    }
  }, [isOpen, currentTheme, colorTheme, isDarkMode]);

  const loadCustomThemes = async () => {
    try {
      const themes = await api.getCustomThemes();
      setCustomThemes(themes);
    } catch (error) {
      console.error('Kunde inte ladda anpassade teman:', error);
    }
  };

  const handleSaveCustomTheme = async () => {
    if (!customThemeName || !customPrimaryColor) {
      showToast('Fyll i namn och primärfärg', { type: 'error' });
      return;
    }

    try {
      await api.createCustomTheme({
        name: customThemeName,
        primary_color: customPrimaryColor,
        secondary_color: customSecondaryColor,
        accent_color: customAccentColor,
        is_default: false
      });
      showToast('Anpassat tema sparat!', { type: 'success' });
      setCustomThemeName('');
      setCustomPrimaryColor('#6366f1');
      setCustomSecondaryColor('#818cf8');
      setCustomAccentColor('#a5b4fc');
      await loadCustomThemes();
    } catch (error) {
      console.error('Kunde inte spara anpassat tema:', error);
      showToast('Kunde inte spara anpassat tema', { type: 'error' });
    }
  };

  const handleThemeSelect = (themeName) => {
    setSelectedTheme(themeName);
    changeTheme(themeName);
    // Apply theme immediately for preview
    applyTheme(themeName);
  };

  const handleModeSelect = async (mode) => {
    const newDarkMode = mode === 'dark';
    setLocalDarkMode(newDarkMode);
    // Apply dark/light mode immediately in real-time
    if (newDarkMode !== isDarkMode && toggleTheme) {
      await toggleTheme();
    }
  };

  const handleSave = async () => {
    // Theme and dark mode are already applied in real-time
    // Just save to backend now
    if (onSave) {
      await onSave({
        colorTheme: selectedTheme,
        darkMode: localDarkMode
      });
    }
    onClose();
  };

  const handleCancel = async () => {
    // Restore original theme and dark mode
    if (originalTheme) {
      changeTheme(originalTheme);
      applyTheme(originalTheme);
    }
    if (originalDarkMode !== null && originalDarkMode !== isDarkMode && toggleTheme) {
      await toggleTheme();
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleCancel} />
      
      <div className="relative w-full max-w-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              selectedTheme === 'indigo' ? 'bg-indigo-100 dark:bg-indigo-900/30' :
              selectedTheme === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30' :
              selectedTheme === 'emerald' ? 'bg-emerald-100 dark:bg-emerald-900/30' :
              selectedTheme === 'purple' ? 'bg-purple-100 dark:bg-purple-900/30' :
              selectedTheme === 'rose' ? 'bg-rose-100 dark:bg-rose-900/30' :
              'bg-amber-100 dark:bg-amber-900/30'
            }`}>
              <Palette size={20} className={`${
                selectedTheme === 'indigo' ? 'text-indigo-600 dark:text-indigo-400' :
                selectedTheme === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                selectedTheme === 'emerald' ? 'text-emerald-600 dark:text-emerald-400' :
                selectedTheme === 'purple' ? 'text-purple-600 dark:text-purple-400' :
                selectedTheme === 'rose' ? 'text-rose-600 dark:text-rose-400' :
                'text-amber-600 dark:text-amber-400'
              }`} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                Anpassa Tema
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Välj ett fördefinierat tema eller anpassa dina egna färger
              </p>
            </div>
          </div>
          <button onClick={handleCancel} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
            <X size={20} className="text-zinc-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0">
          {/* Light/Dark Mode Toggle */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">
              Ljust / Mörkt Läge
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => handleModeSelect('light')}
                className={`flex-1 px-4 py-3 rounded-xl border-2 transition-all ${
                  !localDarkMode
                    ? selectedTheme === 'indigo' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' :
                      selectedTheme === 'blue' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' :
                      selectedTheme === 'emerald' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' :
                      selectedTheme === 'purple' ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' :
                      selectedTheme === 'rose' ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20' :
                      'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                    : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-1">☀️</div>
                  <div className="text-sm font-medium text-zinc-900 dark:text-white">Ljust</div>
                </div>
              </button>
              <button
                onClick={() => handleModeSelect('dark')}
                className={`flex-1 px-4 py-3 rounded-xl border-2 transition-all ${
                  localDarkMode
                    ? selectedTheme === 'indigo' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' :
                      selectedTheme === 'blue' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' :
                      selectedTheme === 'emerald' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' :
                      selectedTheme === 'purple' ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' :
                      selectedTheme === 'rose' ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20' :
                      'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                    : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-1">🌙</div>
                  <div className="text-sm font-medium text-zinc-900 dark:text-white">Mörkt</div>
                </div>
              </button>
            </div>
          </div>

          {/* Predefined Themes */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">
              Fördefinierade Teman
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(themes).map(([key, theme]) => (
                <button
                  key={key}
                  onClick={() => handleThemeSelect(key)}
                  className={`p-4 border-2 rounded-xl transition-all text-left relative ${
                    selectedTheme === key
                      ? key === 'indigo' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 ring-2 ring-indigo-500' :
                        key === 'blue' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-500' :
                        key === 'emerald' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 ring-2 ring-emerald-500' :
                        key === 'purple' ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 ring-2 ring-purple-500' :
                        key === 'rose' ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20 ring-2 ring-rose-500' :
                        'border-amber-500 bg-amber-50 dark:bg-amber-900/20 ring-2 ring-amber-500'
                      : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                  }`}
                >
                  {selectedTheme === key && (
                    <div className="absolute top-2 right-2">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                        key === 'indigo' ? 'bg-indigo-600' :
                        key === 'blue' ? 'bg-blue-600' :
                        key === 'emerald' ? 'bg-emerald-600' :
                        key === 'purple' ? 'bg-purple-600' :
                        key === 'rose' ? 'bg-rose-600' :
                        'bg-amber-600'
                      }`}>
                        <Check size={12} className="text-white" />
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3 mb-2">
                    <div 
                      className={`w-8 h-8 rounded-lg bg-${theme.primary}-500`}
                      style={{
                        backgroundColor: `var(--${theme.primary}-500)`
                      }}
                    />
                    <div className="text-sm font-medium text-zinc-900 dark:text-white">
                      {theme.name}
                    </div>
                  </div>
                  <div className="flex gap-1 mt-2">
                    <div className={`flex-1 h-2 rounded ${
                      key === 'indigo' ? 'bg-indigo-500' :
                      key === 'blue' ? 'bg-blue-500' :
                      key === 'emerald' ? 'bg-emerald-500' :
                      key === 'purple' ? 'bg-purple-500' :
                      key === 'rose' ? 'bg-rose-500' :
                      'bg-amber-500'
                    }`} />
                    <div className={`flex-1 h-2 rounded ${
                      key === 'indigo' ? 'bg-indigo-400' :
                      key === 'blue' ? 'bg-blue-400' :
                      key === 'emerald' ? 'bg-emerald-400' :
                      key === 'purple' ? 'bg-purple-400' :
                      key === 'rose' ? 'bg-rose-400' :
                      'bg-amber-400'
                    }`} />
                    <div className={`flex-1 h-2 rounded ${
                      key === 'indigo' ? 'bg-indigo-300' :
                      key === 'blue' ? 'bg-blue-300' :
                      key === 'emerald' ? 'bg-emerald-300' :
                      key === 'purple' ? 'bg-purple-300' :
                      key === 'rose' ? 'bg-rose-300' :
                      'bg-amber-300'
                    }`} />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Theme Section */}
          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">
              Anpassat Tema
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 block">
                  Primärfärg
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={customPrimaryColor || '#6366f1'}
                    onChange={(e) => setCustomPrimaryColor(e.target.value)}
                    className="w-16 h-10 rounded-lg border border-zinc-300 dark:border-zinc-600 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={customPrimaryColor || '#6366f1'}
                    onChange={(e) => setCustomPrimaryColor(e.target.value)}
                    placeholder="#6366f1"
                    className="flex-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 block">
                  Sekundärfärg (valfritt)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={customSecondaryColor || '#818cf8'}
                    onChange={(e) => setCustomSecondaryColor(e.target.value)}
                    className="w-16 h-10 rounded-lg border border-zinc-300 dark:border-zinc-600 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={customSecondaryColor || '#818cf8'}
                    onChange={(e) => setCustomSecondaryColor(e.target.value)}
                    placeholder="#818cf8"
                    className="flex-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 block">
                  Accentfärg (valfritt)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={customAccentColor || '#a5b4fc'}
                    onChange={(e) => setCustomAccentColor(e.target.value)}
                    className="w-16 h-10 rounded-lg border border-zinc-300 dark:border-zinc-600 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={customAccentColor || '#a5b4fc'}
                    onChange={(e) => setCustomAccentColor(e.target.value)}
                    placeholder="#a5b4fc"
                    className="flex-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 block">
                  Tema-namn
                </label>
                <input
                  type="text"
                  value={customThemeName || ''}
                  onChange={(e) => setCustomThemeName(e.target.value)}
                  placeholder="Mitt anpassade tema"
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <button
                onClick={handleSaveCustomTheme}
                disabled={!customThemeName || !customPrimaryColor}
                className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-400 text-white rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed"
              >
                Spara Anpassat Tema
              </button>
            </div>
          </div>

          {/* Preview */}
          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">
              Förhandsgranskning
            </h3>
            <div className={`p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 ${
              selectedTheme === 'indigo' ? 'bg-indigo-50 dark:bg-indigo-900/20' :
              selectedTheme === 'blue' ? 'bg-blue-50 dark:bg-blue-900/20' :
              selectedTheme === 'emerald' ? 'bg-emerald-50 dark:bg-emerald-900/20' :
              selectedTheme === 'purple' ? 'bg-purple-50 dark:bg-purple-900/20' :
              selectedTheme === 'rose' ? 'bg-rose-50 dark:bg-rose-900/20' :
              'bg-amber-50 dark:bg-amber-900/20'
            }`}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-lg ${
                  selectedTheme === 'indigo' ? 'bg-indigo-500' :
                  selectedTheme === 'blue' ? 'bg-blue-500' :
                  selectedTheme === 'emerald' ? 'bg-emerald-500' :
                  selectedTheme === 'purple' ? 'bg-purple-500' :
                  selectedTheme === 'rose' ? 'bg-rose-500' :
                  'bg-amber-500'
                }`} />
                <div>
                  <div className={`text-sm font-semibold ${
                    selectedTheme === 'indigo' ? 'text-indigo-700 dark:text-indigo-300' :
                    selectedTheme === 'blue' ? 'text-blue-700 dark:text-blue-300' :
                    selectedTheme === 'emerald' ? 'text-emerald-700 dark:text-emerald-300' :
                    selectedTheme === 'purple' ? 'text-purple-700 dark:text-purple-300' :
                    selectedTheme === 'rose' ? 'text-rose-700 dark:text-rose-300' :
                    'text-amber-700 dark:text-amber-300'
                  }`}>
                    {themes[selectedTheme]?.name || 'Indigo'} Tema
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    {localDarkMode ? 'Mörkt läge' : 'Ljust läge'}
                  </div>
                </div>
              </div>
              <button 
                className={`px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors ${
                  selectedTheme === 'indigo' ? 'bg-indigo-600 hover:bg-indigo-700' :
                  selectedTheme === 'blue' ? 'bg-blue-600 hover:bg-blue-700' :
                  selectedTheme === 'emerald' ? 'bg-emerald-600 hover:bg-emerald-700' :
                  selectedTheme === 'purple' ? 'bg-purple-600 hover:bg-purple-700' :
                  selectedTheme === 'rose' ? 'bg-rose-600 hover:bg-rose-700' :
                  'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                Exempelknapp
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-3 flex-shrink-0">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-sm font-medium"
          >
            Avbryt
          </button>
          <button
            onClick={handleSave}
            className={`px-6 py-2 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2 ${
              selectedTheme === 'indigo' ? 'bg-indigo-600 hover:bg-indigo-700' :
              selectedTheme === 'blue' ? 'bg-blue-600 hover:bg-blue-700' :
              selectedTheme === 'emerald' ? 'bg-emerald-600 hover:bg-emerald-700' :
              selectedTheme === 'purple' ? 'bg-purple-600 hover:bg-purple-700' :
              selectedTheme === 'rose' ? 'bg-rose-600 hover:bg-rose-700' :
              'bg-amber-600 hover:bg-amber-700'
            }`}
          >
            <Check size={16} />
            Spara Tema
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThemeCustomizer;

