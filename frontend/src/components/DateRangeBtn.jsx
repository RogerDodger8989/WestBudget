import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeButtonClass, getThemeTextClass, getThemeBgClass } from '../utils/getThemeClasses';

const DateRangeBtn = ({ children, active, onClick, icon }) => {
  const { colorTheme } = useTheme();
  
  // Helper function to get active button classes
  const getActiveClass = () => {
    const themeMap = {
      indigo: 'bg-indigo-600 text-white dark:bg-indigo-600 dark:text-white shadow-sm',
      blue: 'bg-blue-600 text-white dark:bg-blue-600 dark:text-white shadow-sm',
      emerald: 'bg-emerald-600 text-white dark:bg-emerald-600 dark:text-white shadow-sm',
      purple: 'bg-purple-600 text-white dark:bg-purple-600 dark:text-white shadow-sm',
      rose: 'bg-rose-600 text-white dark:bg-rose-600 dark:text-white shadow-sm',
      amber: 'bg-amber-600 text-white dark:bg-amber-600 dark:text-white shadow-sm'
    };
    return themeMap[colorTheme] || themeMap.indigo;
  };
  
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
        active
          ? getActiveClass()
          : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-300/50 dark:hover:bg-zinc-800/50'
      }`}
    >
      {icon}
      {children}
    </button>
  );
};

export default DateRangeBtn;

