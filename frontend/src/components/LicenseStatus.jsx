import React, { useEffect, useState } from 'react';
import { CreditCard, Calendar, AlertCircle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { useLicense } from '../contexts/LicenseContext';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeButtonClass, getThemeTextClass } from '../utils/getThemeClasses';
import { api } from '../api';
import { useToast } from '../contexts/ToastContext';

const LicenseStatus = () => {
  const { license, licenseStatus, loading, loadLicenseStatus, validateLicense, isOnline } = useLicense();
  const { colorTheme } = useTheme();
  const { showToast } = useToast();
  const [validating, setValidating] = useState(false);

  const handleValidate = async () => {
    setValidating(true);
    try {
      await validateLicense();
      showToast('Licens validerad', { type: 'success' });
      await loadLicenseStatus();
    } catch (error) {
      showToast('Kunde inte validera licens', { type: 'error' });
    } finally {
      setValidating(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
        <div className="animate-pulse">
          <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!licenseStatus || !licenseStatus.has_license) {
    return (
      <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
        <div className="flex items-center gap-3 mb-4">
          <XCircle className="text-rose-500" size={24} />
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
            Ingen licens
          </h3>
        </div>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Du har ingen aktiv licens. Kontakta support för att aktivera en licens.
        </p>
      </div>
    );
  }

  const { status, license_type, days_remaining, is_expired, grace_period_expired, can_use } = licenseStatus;
  const licenseData = licenseStatus.license || license;

  const getStatusIcon = () => {
    if (is_expired || !can_use) return <XCircle className="text-rose-500" size={24} />;
    if (grace_period_expired) return <AlertCircle className="text-amber-500" size={24} />;
    if (days_remaining !== null && days_remaining <= 7) return <AlertCircle className="text-amber-500" size={24} />;
    return <CheckCircle className="text-emerald-500" size={24} />;
  };

  const getStatusText = () => {
    if (is_expired) return 'Utgången';
    if (grace_period_expired) return 'Grace period utgången';
    if (status === 'active') return 'Aktiv';
    return status;
  };

  const getStatusColor = () => {
    if (is_expired || !can_use) return 'text-rose-500';
    if (grace_period_expired) return 'text-amber-500';
    if (days_remaining !== null && days_remaining <= 7) return 'text-amber-500';
    return 'text-emerald-500';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Aldrig';
    const date = new Date(dateString);
    return date.toLocaleDateString('sv-SE', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CreditCard className="text-indigo-500" size={24} />
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
            Licensstatus
          </h3>
        </div>
        <button
          onClick={handleValidate}
          disabled={validating}
          className={`p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50 ${validating ? 'animate-spin' : ''}`}
          title="Validera licens"
        >
          <RefreshCw size={18} className="text-zinc-600 dark:text-zinc-400" />
        </button>
      </div>

      {/* Status */}
      <div className="flex items-center gap-3">
        {getStatusIcon()}
        <div>
          <p className={`font-semibold ${getStatusColor()}`}>
            {getStatusText()}
          </p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {license_type === 'trial' ? 'Provperiod' : 'Premium'}
          </p>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
        {licenseData.starts_at && (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="text-zinc-400" size={16} />
            <span className="text-zinc-600 dark:text-zinc-400">Startade:</span>
            <span className="text-zinc-900 dark:text-white">{formatDate(licenseData.starts_at)}</span>
          </div>
        )}
        
        {licenseData.expires_at && (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="text-zinc-400" size={16} />
            <span className="text-zinc-600 dark:text-zinc-400">Går ut:</span>
            <span className={`${days_remaining !== null && days_remaining <= 7 ? 'text-amber-500' : 'text-zinc-900 dark:text-white'}`}>
              {formatDate(licenseData.expires_at)}
              {days_remaining !== null && ` (${days_remaining} dagar kvar)`}
            </span>
          </div>
        )}

        {licenseData.last_validated_at && (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="text-zinc-400" size={16} />
            <span className="text-zinc-600 dark:text-zinc-400">Senast validerad:</span>
            <span className="text-zinc-900 dark:text-white">{formatDate(licenseData.last_validated_at)}</span>
          </div>
        )}
      </div>

      {/* Warnings */}
      {days_remaining !== null && days_remaining <= 7 && days_remaining > 0 && (
        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            ⚠️ Din {license_type === 'trial' ? 'provperiod' : 'licens'} går ut om {days_remaining} {days_remaining === 1 ? 'dag' : 'dagar'}.
            {license_type === 'trial' && ' Uppgradera till Premium för att fortsätta använda appen.'}
          </p>
        </div>
      )}

      {is_expired && (
        <div className="p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg">
          <p className="text-sm text-rose-800 dark:text-rose-200">
            ❌ Din licens har gått ut. Kontakta support eller uppgradera till Premium.
          </p>
        </div>
      )}

      {grace_period_expired && (
        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            ⚠️ Grace period har gått ut. Du behöver validera din licens online.
          </p>
        </div>
      )}
    </div>
  );
};

export default LicenseStatus;

