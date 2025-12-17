import React from 'react';

const NavItem = ({ icon, label, active, onClick, collapsed }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center ${collapsed ? 'justify-center px-0' : 'px-4'} py-3 rounded-xl text-sm font-medium transition-all group relative ${
      active 
        ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' 
        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
    }`}
  >
    <div className="relative">
      {React.cloneElement(icon, { 
        size: 20, 
        className: `transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}` 
      })}
      {active && <span className="absolute -right-2 top-0 w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />}
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

export default NavItem;

