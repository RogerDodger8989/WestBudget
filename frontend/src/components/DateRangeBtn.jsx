import React from 'react';

const DateRangeBtn = ({ children, active, onClick, icon }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
      active
        ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-300/50 dark:hover:bg-zinc-800/50'
    }`}
  >
    {icon}
    {children}
  </button>
);

export default DateRangeBtn;

