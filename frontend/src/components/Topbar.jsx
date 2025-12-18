import React, { useState } from 'react';
import { Bell, Search } from 'lucide-react';

const Topbar = ({ onSearch, searchQuery: externalSearchQuery }) => {
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const searchQuery = externalSearchQuery !== undefined ? externalSearchQuery : localSearchQuery;

  const handleSearchChange = (e) => {
    const value = e.target.value;
    if (externalSearchQuery === undefined) {
      setLocalSearchQuery(value);
    }
    if (onSearch) {
      onSearch(value);
    }
  };

  return (
    <header className="h-20 border-b border-zinc-200 dark:border-zinc-900 flex items-center justify-between px-8 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-20 transition-colors duration-500">
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
        <input 
          type="text" 
          placeholder="Sök transaktioner, belopp, ID..." 
          value={searchQuery}
          onChange={handleSearchChange}
          className="bg-zinc-100 dark:bg-zinc-900/50 border-none rounded-full py-2.5 pl-10 pr-4 text-sm text-zinc-900 dark:text-zinc-300 placeholder-zinc-500 dark:placeholder-zinc-600 w-64 focus:ring-2 focus:ring-indigo-500/50 focus:bg-white dark:focus:bg-zinc-900 transition-all"
        />
      </div>
      <div className="flex items-center gap-4">
        <button className="relative p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-zinc-950"></span>
        </button>
        <div className="flex items-center gap-3 pl-4 border-l border-zinc-200 dark:border-zinc-800">
          <div className="w-9 h-9 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-md">
            JD
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-zinc-900 dark:text-white">John Doe</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-500">Premium Licens</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;

