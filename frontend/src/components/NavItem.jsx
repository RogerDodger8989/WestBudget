import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const NavItem = ({ icon, label, active, onClick, collapsed }) => {
  const { colorTheme } = useTheme();
  
  const getActiveClasses = () => {
    const theme = colorTheme;
    if (theme === 'indigo') return 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400';
    if (theme === 'blue') return 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400';
    if (theme === 'emerald') return 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
    if (theme === 'purple') return 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400';
    if (theme === 'rose') return 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400';
    if (theme === 'amber') return 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400';
    return 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400';
  };
  
  const getActiveDotClass = () => {
    const theme = colorTheme;
    if (theme === 'indigo') return 'bg-indigo-500';
    if (theme === 'blue') return 'bg-blue-500';
    if (theme === 'emerald') return 'bg-emerald-500';
    if (theme === 'purple') return 'bg-purple-500';
    if (theme === 'rose') return 'bg-rose-500';
    if (theme === 'amber') return 'bg-amber-500';
    return 'bg-indigo-500';
  };
  
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center ${collapsed ? 'justify-center px-0' : 'px-4'} py-3 rounded-xl text-sm font-medium transition-all group relative ${
        active 
          ? getActiveClasses()
          : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
      }`}
    >
      <div className="relative">
        {React.cloneElement(icon, { 
          size: 20, 
          className: `transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}` 
        })}
        {active && <span className={`absolute -right-2 top-0 w-1.5 h-1.5 ${getActiveDotClass()} rounded-full animate-pulse`} />}
      </div>
    
      <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${
        collapsed ? 'w-0 opacity-0 ml-0' : 'w-auto opacity-100 ml-3'
      }`}>
        {label}
      </span>

      {collapsed && (
        <div className="absolute left-full ml-2 px-2 py-1 bg-zinc-900 dark:bg-white text-white dark:text-black text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-lg">
          {label}
        </div>
      )}
    </button>
  );
};

export default NavItem;
