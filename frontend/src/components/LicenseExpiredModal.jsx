import React from 'react';
import { XCircle, CreditCard, X } from 'lucide-react';
import { useLicense } from '../contexts/LicenseContext';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeButtonClass, getThemeBgClass, getThemeTextClass, getThemeBorderClass } from '../utils/getThemeClasses';
import UpgradeToPremium from './UpgradeToPremium';

const LicenseExpiredModal = ({ isOpen, onClose }) => {
  const { license, licenseStatus } = useLicense();
  const { colorTheme } = useTheme();

  if (!isOpen) return null;

  const isExpired = licenseStatus?.status === 'expired' || licenseStatus?.status === 'invalid';

  if (!isExpired) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`relative ${getThemeBgClass(colorTheme)} ${getThemeBorderClass(colorTheme)} border-2 rounded-2xl shadow-2xl max-w-md w-full p-6 z-10`}>
        {/* Close button */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 ${getThemeTextClass(colorTheme)} hover:opacity-70 transition-opacity`}
          aria-label="Stäng"
        >
          <X size={20} />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-rose-100 dark:bg-rose-900/30 rounded-full">
            <XCircle className="text-rose-600 dark:text-rose-400" size={48} />
          </div>
        </div>

        {/* Content */}
        <div className="text-center mb-6">
          <h2 className={`${getThemeTextClass(colorTheme)} text-2xl font-bold mb-2`}>
            Licens har gått ut
          </h2>
          <p className={`${getThemeTextClass(colorTheme)} opacity-80 mb-4`}>
            Din {license?.license_type === 'trial' ? 'provperiod' : 'prenumeration'} har gått ut. 
            Uppgradera till Premium för att fortsätta använda WestBudget.
          </p>
          
          {license?.expires_at && (
            <p className={`${getThemeTextClass(colorTheme)} text-sm opacity-60 mb-4`}>
              Gick ut: {new Date(license.expires_at).toLocaleDateString('sv-SE', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          )}
        </div>

        {/* Upgrade component */}
        <div className="mb-4">
          <UpgradeToPremium />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className={`flex-1 px-4 py-2 ${getThemeBorderClass(colorTheme)} border rounded-xl ${getThemeTextClass(colorTheme)} hover:opacity-70 transition-opacity`}
          >
            Stäng
          </button>
        </div>
      </div>
    </div>
  );
};

export default LicenseExpiredModal;

