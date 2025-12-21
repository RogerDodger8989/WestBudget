import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useLicense } from '../contexts/LicenseContext';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeBgClass, getThemeTextClass } from '../utils/getThemeClasses';

const TrialBanner = ({ onDismiss, dismissed = false }) => {
  const { license, licenseStatus } = useLicense();
  const { colorTheme } = useTheme();
  const [isDismissed, setIsDismissed] = React.useState(dismissed);

  if (isDismissed || !license || !licenseStatus) return null;

  // Only show for trial licenses
  if (license.license_type !== 'trial') return null;

  // Check if trial expires within 7 days
  const expiresAt = new Date(license.expires_at);
  const now = new Date();
  const daysUntilExpiry = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));

  // Only show if 7 days or less remaining
  if (daysUntilExpiry > 7) return null;

  // Don't show if already expired
  if (daysUntilExpiry <= 0) return null;

  const handleDismiss = () => {
    setIsDismissed(true);
    if (onDismiss) {
      onDismiss();
    }
  };

  const getMessage = () => {
    if (daysUntilExpiry === 1) {
      return 'Din provperiod går ut imorgon!';
    } else if (daysUntilExpiry <= 3) {
      return `Din provperiod går ut om ${daysUntilExpiry} dagar!`;
    } else {
      return `Din provperiod går ut om ${daysUntilExpiry} dagar.`;
    }
  };

  return (
    <div className={`${getThemeBgClass(colorTheme, 'amber', 50)} dark:bg-amber-900/20 border-l-4 border-amber-500 dark:border-amber-400 p-4 mb-4 rounded-lg shadow-sm`}>
      <div className="flex items-start gap-3">
        <AlertTriangle className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" size={20} />
        <div className="flex-1">
          <h3 className={`${getThemeTextClass(colorTheme)} font-semibold mb-1`}>
            Provperiod går ut snart
          </h3>
          <p className={`${getThemeTextClass(colorTheme)} text-sm opacity-90`}>
            {getMessage()} Uppgradera till Premium för att fortsätta använda alla funktioner.
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className={`${getThemeTextClass(colorTheme)} hover:opacity-70 transition-opacity flex-shrink-0`}
          aria-label="Stäng"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

export default TrialBanner;

