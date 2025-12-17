import React from 'react';
import { Sun, Moon } from 'lucide-react';

const ThemeToggle = ({ isDark, toggle }) => (
  <button 
    onClick={toggle}
    className="relative p-2.5 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-lg hover:scale-105 active:scale-95 transition-all duration-300 group overflow-hidden"
    aria-label="Växla tema"
  >
    <div className="relative w-5 h-5">
      <Sun 
        className={`w-5 h-5 text-amber-500 absolute inset-0 transition-all duration-500 transform ${
          isDark ? 'rotate-90 opacity-0 scale-50' : 'rotate-0 opacity-100 scale-100'
        }`} 
      />
      <Moon 
        className={`w-5 h-5 text-indigo-400 absolute inset-0 transition-all duration-500 transform ${
          isDark ? 'rotate-0 opacity-100 scale-100' : '-rotate-90 opacity-0 scale-50'
        }`} 
      />
    </div>
  </button>
);

export default ThemeToggle;

