// Helper function to get theme-aware class names
// Since Tailwind doesn't support dynamic class generation, we use a mapping approach

export const getThemeButtonClasses = (themeName, isDark = false) => {
  const themeMap = {
    indigo: isDark 
      ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
      : 'bg-indigo-600 hover:bg-indigo-700 text-white',
    blue: isDark 
      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
      : 'bg-blue-600 hover:bg-blue-700 text-white',
    emerald: isDark 
      ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
      : 'bg-emerald-600 hover:bg-emerald-700 text-white',
    purple: isDark 
      ? 'bg-purple-600 hover:bg-purple-700 text-white' 
      : 'bg-purple-600 hover:bg-purple-700 text-white',
    rose: isDark 
      ? 'bg-rose-600 hover:bg-rose-700 text-white' 
      : 'bg-rose-600 hover:bg-rose-700 text-white',
    amber: isDark 
      ? 'bg-amber-600 hover:bg-amber-700 text-white' 
      : 'bg-amber-600 hover:bg-amber-700 text-white',
  };
  return themeMap[themeName] || themeMap.indigo;
};

export const getThemeTextClasses = (themeName, isDark = false) => {
  const themeMap = {
    indigo: isDark ? 'text-indigo-400' : 'text-indigo-600',
    blue: isDark ? 'text-blue-400' : 'text-blue-600',
    emerald: isDark ? 'text-emerald-400' : 'text-emerald-600',
    purple: isDark ? 'text-purple-400' : 'text-purple-600',
    rose: isDark ? 'text-rose-400' : 'text-rose-600',
    amber: isDark ? 'text-amber-400' : 'text-amber-600',
  };
  return themeMap[themeName] || themeMap.indigo;
};

export const getThemeBgClasses = (themeName, isDark = false) => {
  const themeMap = {
    indigo: isDark ? 'bg-indigo-900/30' : 'bg-indigo-50',
    blue: isDark ? 'bg-blue-900/30' : 'bg-blue-50',
    emerald: isDark ? 'bg-emerald-900/30' : 'bg-emerald-50',
    purple: isDark ? 'bg-purple-900/30' : 'bg-purple-50',
    rose: isDark ? 'bg-rose-900/30' : 'bg-rose-50',
    amber: isDark ? 'bg-amber-900/30' : 'bg-amber-50',
  };
  return themeMap[themeName] || themeMap.indigo;
};

export const getThemeBorderClasses = (themeName, isDark = false) => {
  const themeMap = {
    indigo: isDark ? 'border-indigo-500' : 'border-indigo-500',
    blue: isDark ? 'border-blue-500' : 'border-blue-500',
    emerald: isDark ? 'border-emerald-500' : 'border-emerald-500',
    purple: isDark ? 'border-purple-500' : 'border-purple-500',
    rose: isDark ? 'border-rose-500' : 'border-rose-500',
    amber: isDark ? 'border-amber-500' : 'border-amber-500',
  };
  return themeMap[themeName] || themeMap.indigo;
};


