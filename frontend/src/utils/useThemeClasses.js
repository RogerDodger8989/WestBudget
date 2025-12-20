import { useTheme } from '../contexts/ThemeContext';

// Hook to get theme-aware class names
export const useThemeClasses = (isDark = false) => {
  const { colorTheme } = useTheme();
  
  const getButtonClasses = () => {
    const themeMap = {
      indigo: 'bg-indigo-600 hover:bg-indigo-700 text-white',
      blue: 'bg-blue-600 hover:bg-blue-700 text-white',
      emerald: 'bg-emerald-600 hover:bg-emerald-700 text-white',
      purple: 'bg-purple-600 hover:bg-purple-700 text-white',
      rose: 'bg-rose-600 hover:bg-rose-700 text-white',
      amber: 'bg-amber-600 hover:bg-amber-700 text-white',
    };
    return themeMap[colorTheme] || themeMap.indigo;
  };

  const getTextClasses = () => {
    const themeMap = {
      indigo: isDark ? 'text-indigo-400' : 'text-indigo-600',
      blue: isDark ? 'text-blue-400' : 'text-blue-600',
      emerald: isDark ? 'text-emerald-400' : 'text-emerald-600',
      purple: isDark ? 'text-purple-400' : 'text-purple-600',
      rose: isDark ? 'text-rose-400' : 'text-rose-600',
      amber: isDark ? 'text-amber-400' : 'text-amber-600',
    };
    return themeMap[colorTheme] || themeMap.indigo;
  };

  const getBgClasses = () => {
    const themeMap = {
      indigo: isDark ? 'bg-indigo-900/30' : 'bg-indigo-50',
      blue: isDark ? 'bg-blue-900/30' : 'bg-blue-50',
      emerald: isDark ? 'bg-emerald-900/30' : 'bg-emerald-50',
      purple: isDark ? 'bg-purple-900/30' : 'bg-purple-50',
      rose: isDark ? 'bg-rose-900/30' : 'bg-rose-50',
      amber: isDark ? 'bg-amber-900/30' : 'bg-amber-50',
    };
    return themeMap[colorTheme] || themeMap.indigo;
  };

  return {
    button: getButtonClasses(),
    text: getTextClasses(),
    bg: getBgClasses(),
    theme: colorTheme
  };
};


