import React, { useState, useEffect } from 'react';
import TrialBanner from './TrialBanner';
import LicenseExpiredModal from './LicenseExpiredModal';
import { useLicense } from '../contexts/LicenseContext';
import { useAuth } from '../contexts/AuthContext';
import { AlertCircle, XCircle, Lock } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeButtonClass } from '../utils/getThemeClasses';

const LicenseGate = ({ children }) => {
  const { canUse, licenseStatus, loading, license } = useLicense();
  const { isAuthenticated } = useAuth();
  const { colorTheme } = useTheme();
  const [showExpiredModal, setShowExpiredModal] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // Show expired modal if license is expired
  useEffect(() => {
    if (licenseStatus?.is_expired && canUse === false) {
      setShowExpiredModal(true);
    } else {
      setShowExpiredModal(false);
    }
  }, [licenseStatus?.is_expired, canUse]);

  // Don't block if not authenticated (login will handle it)
  if (!isAuthenticated) {
    return <>{children}</>;
  }

  // Don't block while loading
  if (loading) {
    return <>{children}</>;
  }

  // Block if license is invalid (but not expired - that's handled by modal)
  if (!canUse && !licenseStatus?.is_expired) {
    const gracePeriodExpired = licenseStatus?.grace_period_expired;

    return (
      <>
        <LicenseExpiredModal 
          isOpen={showExpiredModal} 
          onClose={() => setShowExpiredModal(false)} 
        />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mb-4">
                <Lock className="text-rose-600 dark:text-rose-400" size={32} />
              </div>
              
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
                Licensvalidering krävs
              </h2>
              
              <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                {gracePeriodExpired && (
                  <>Din grace period har gått ut. Du behöver validera din licens online för att fortsätta använda appen.</>
                )}
                {!gracePeriodExpired && (
                  <>Din licens kunde inte valideras. Kontakta support för hjälp.</>
                )}
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => window.location.reload()}
                  className={`w-full py-3 ${getThemeButtonClass(colorTheme, 'primary')} rounded-xl font-medium transition-all`}
                >
                  Försök igen
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Show expired modal if needed
  if (showExpiredModal) {
    return (
      <>
        <LicenseExpiredModal 
          isOpen={showExpiredModal} 
          onClose={() => setShowExpiredModal(false)} 
        />
        {children}
      </>
    );
  }

  // Show trial banner if license expires soon (and not expired)
  return (
    <>
      <LicenseExpiredModal 
        isOpen={showExpiredModal} 
        onClose={() => setShowExpiredModal(false)} 
      />
      {!bannerDismissed && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-40 max-w-2xl w-full px-4">
          <TrialBanner 
            onDismiss={() => setBannerDismissed(true)} 
            dismissed={bannerDismissed}
          />
        </div>
      )}
      {children}
    </>
  );
};

export default LicenseGate;
