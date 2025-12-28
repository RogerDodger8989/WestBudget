import React, { useMemo } from 'react';
import NotificationBell from './NotificationBell';
import { useLicense } from '../contexts/LicenseContext';

const Topbar = ({ agreements = [], vehicles = [], userName = '' }) => {
  const { licenseStatus } = useLicense();

  // Generate initials from user name
  const initials = useMemo(() => {
    if (!userName || userName.trim() === '') {
      return 'JD'; // Default to JD if no name
    }
    const parts = userName.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    } else if (parts.length === 1 && parts[0].length >= 2) {
      return parts[0].substring(0, 2).toUpperCase();
    } else if (parts[0].length === 1) {
      return parts[0].toUpperCase() + parts[0].toUpperCase();
    }
    return 'JD';
  }, [userName]);

  const displayName = userName || 'John Doe';

  return (
    <header className="h-20 border-b border-zinc-200 dark:border-zinc-900 flex items-center justify-end px-8 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-20 transition-colors duration-500">
      <div className="flex items-center gap-4">
        <NotificationBell agreements={agreements} vehicles={vehicles} />
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-md">
            {initials}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-zinc-900 dark:text-white">{displayName}</p>
            {licenseStatus && licenseStatus.days_remaining != null && (
              <p className={`text-xs ${licenseStatus.days_remaining <= 7 ? 'text-amber-500 font-medium' : 'text-zinc-500 dark:text-zinc-400'}`}>
                {licenseStatus.days_remaining} {licenseStatus.days_remaining === 1 ? 'dag' : 'dagar'} kvar
              </p>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;

