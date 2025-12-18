import React from 'react';
import NotificationBell from './NotificationBell';

const Topbar = ({ agreements }) => {
  return (
    <header className="h-20 border-b border-zinc-200 dark:border-zinc-900 flex items-center justify-end px-8 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-20 transition-colors duration-500">
      <div className="flex items-center gap-4">
        <NotificationBell agreements={agreements || []} />
        <div className="flex items-center gap-3">
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

