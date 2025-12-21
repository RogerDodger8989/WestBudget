import React from 'react';
import { useLicense } from '../contexts/LicenseContext';
import { useAuth } from '../contexts/AuthContext';
import { AlertCircle, XCircle, Lock } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeButtonClass } from '../utils/getThemeClasses';

const LicenseGate = ({ children }) => {
  const { canUse, licenseStatus, loading } = useLicense();
  const { isAuthenticated } = useAuth();
  const { colorTheme } = useTheme();

  // Don't block if not authenticated (login will handle it)
  if (!isAuthenticated) {
    return <>{children}</>;
  }

  // Don't block while loading
  if (loading) {
    return <>{children}</>;
  }

  // Block if license is invalid
  if (!canUse) {
    const isExpired = licenseStatus?.is_expired;
    const gracePeriodExpired = licenseStatus?.grace_period_expired;
    const daysRemaining = licenseStatus?.days_remaining;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mb-4">
              {isExpired ? (
                <XCircle className="text-rose-600 dark:text-rose-400" size={32} />
              ) : (
                <Lock className="text-rose-600 dark:text-rose-400" size={32} />
              )}
            </div>
            
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
              {isExpired ? 'Licens har gått ut' : 'Licensvalidering krävs'}
            </h2>
            
            <p className="text-zinc-600 dark:text-zinc-400 mb-6">
              {isExpired && (
                <>Din {licenseStatus?.license_type === 'trial' ? 'provperiod' : 'licens'} har gått ut. Uppgradera till Premium för att fortsätta använda appen.</>
              )}
              {gracePeriodExpired && !isExpired && (
                <>Din grace period har gått ut. Du behöver validera din licens online för att fortsätta använda appen.</>
              )}
              {!isExpired && !gracePeriodExpired && (
                <>Din licens kunde inte valideras. Kontakta support för hjälp.</>
              )}
            </p>

            <div className="space-y-3">
              {!isExpired && (
                <button
                  onClick={() => window.location.reload()}
                  className={`w-full py-3 ${getThemeButtonClass(colorTheme, 'primary')} rounded-xl font-medium transition-all`}
                >
                  Försök igen
                </button>
              )}
              
              {isExpired && (
                <button
                  onClick={() => {
                    // TODO: Navigate to upgrade page when implemented
                    window.location.href = '/settings';
                  }}
                  className={`w-full py-3 ${getThemeButtonClass(colorTheme, 'primary')} rounded-xl font-medium transition-all`}
                >
                  Uppgradera till Premium
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show warning banner if license expires soon
  if (licenseStatus && licenseStatus.days_remaining !== null && licenseStatus.days_remaining <= 7 && licenseStatus.days_remaining > 0) {
    return (
      <>
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-40 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-xl shadow-lg p-4 max-w-md">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-amber-600 dark:text-amber-400 flex-shrink-0" size={20} />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Din {licenseStatus.license_type === 'trial' ? 'provperiod' : 'licens'} går ut om {licenseStatus.days_remaining} {licenseStatus.days_remaining === 1 ? 'dag' : 'dagar'}
              </p>
            </div>
            <button
              onClick={() => {
                // TODO: Navigate to upgrade page when implemented
                window.location.href = '/settings';
              }}
              className="text-xs font-medium text-amber-800 dark:text-amber-200 hover:underline"
            >
              Uppgradera
            </button>
          </div>
        </div>
        {children}
      </>
    );
  }

  return <>{children}</>;
};

export default LicenseGate;
