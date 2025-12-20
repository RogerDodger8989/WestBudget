// Comprehensive theme utility functions
// Since Tailwind doesn't support dynamic class generation, we use a mapping approach

export const getThemeButtonClass = (themeName, variant = 'primary') => {
  const themeMap = {
    indigo: {
      primary: 'bg-indigo-600 hover:bg-indigo-700 text-white',
      secondary: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900/50',
      outline: 'border-indigo-500 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20',
      ghost: 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
    },
    blue: {
      primary: 'bg-blue-600 hover:bg-blue-700 text-white',
      secondary: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50',
      outline: 'border-blue-500 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20',
      ghost: 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
    },
    emerald: {
      primary: 'bg-emerald-600 hover:bg-emerald-700 text-white',
      secondary: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/50',
      outline: 'border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20',
      ghost: 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
    },
    purple: {
      primary: 'bg-purple-600 hover:bg-purple-700 text-white',
      secondary: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50',
      outline: 'border-purple-500 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20',
      ghost: 'text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20'
    },
    rose: {
      primary: 'bg-rose-600 hover:bg-rose-700 text-white',
      secondary: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 hover:bg-rose-200 dark:hover:bg-rose-900/50',
      outline: 'border-rose-500 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20',
      ghost: 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20'
    },
    amber: {
      primary: 'bg-amber-600 hover:bg-amber-700 text-white',
      secondary: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/50',
      outline: 'border-amber-500 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20',
      ghost: 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20'
    }
  };
  
  const theme = themeMap[themeName] || themeMap.indigo;
  return theme[variant] || theme.primary;
};

export const getThemeTextClass = (themeName, isDark = false) => {
  const themeMap = {
    indigo: isDark ? 'text-indigo-400' : 'text-indigo-600',
    blue: isDark ? 'text-blue-400' : 'text-blue-600',
    emerald: isDark ? 'text-emerald-400' : 'text-emerald-600',
    purple: isDark ? 'text-purple-400' : 'text-purple-600',
    rose: isDark ? 'text-rose-400' : 'text-rose-600',
    amber: isDark ? 'text-amber-400' : 'text-amber-600'
  };
  return themeMap[themeName] || themeMap.indigo;
};

export const getThemeBgClass = (themeName, isDark = false) => {
  const themeMap = {
    indigo: isDark ? 'bg-indigo-900/30' : 'bg-indigo-50',
    blue: isDark ? 'bg-blue-900/30' : 'bg-blue-50',
    emerald: isDark ? 'bg-emerald-900/30' : 'bg-emerald-50',
    purple: isDark ? 'bg-purple-900/30' : 'bg-purple-50',
    rose: isDark ? 'bg-rose-900/30' : 'bg-rose-50',
    amber: isDark ? 'bg-amber-900/30' : 'bg-amber-50'
  };
  return themeMap[themeName] || themeMap.indigo;
};

export const getThemeBorderClass = (themeName) => {
  const themeMap = {
    indigo: 'border-indigo-500',
    blue: 'border-blue-500',
    emerald: 'border-emerald-500',
    purple: 'border-purple-500',
    rose: 'border-rose-500',
    amber: 'border-amber-500'
  };
  return themeMap[themeName] || themeMap.indigo;
};

export const getThemeRingClass = (themeName) => {
  const themeMap = {
    indigo: 'ring-indigo-500',
    blue: 'ring-blue-500',
    emerald: 'ring-emerald-500',
    purple: 'ring-purple-500',
    rose: 'ring-rose-500',
    amber: 'ring-amber-500'
  };
  return themeMap[themeName] || themeMap.indigo;
};


