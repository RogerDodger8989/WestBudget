import React, { useState, useEffect } from 'react';
import { CreditCard, Calendar, AlertCircle, CheckCircle, XCircle, RefreshCw, X } from 'lucide-react';
import { api } from '../api';
import { useToast } from '../contexts/ToastContext';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeButtonClass, getThemeTextClass } from '../utils/getThemeClasses';
import { useLicense } from '../contexts/LicenseContext';
import UpgradeToPremium from './UpgradeToPremium';

const SubscriptionManagement = () => {
  const { showToast } = useToast();
  const { colorTheme } = useTheme();
  const { licenseStatus } = useLicense();
  const [subscription, setSubscription] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [resuming, setResuming] = useState(false);

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    setLoading(true);
    try {
      const paymentHistory = await api.getPaymentHistory();
      setPayments(paymentHistory);
      
      // Get subscription details from backend
      try {
        const subscriptionData = await api.getCurrentSubscription();
        setSubscription(subscriptionData);
      } catch (error) {
        // No subscription found is OK (user might be on trial)
        if (error.message && !error.message.includes('404') && !error.message.includes('No subscription found')) {
          console.error('Error loading subscription:', error);
        }
        setSubscription(null);
      }
    } catch (error) {
      console.error('Error loading subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Är du säker på att du vill avbryta din prenumeration? Du kommer att förlora tillgång till Premium när den nuvarande perioden går ut.')) {
      return;
    }
    
    setCancelling(true);
    try {
      await api.cancelSubscription();
      showToast('Prenumeration kommer att avbrytas vid periodens slut', { type: 'success' });
      await loadSubscriptionData();
    } catch (error) {
      showToast(error.message || 'Kunde inte avbryta prenumeration', { type: 'error' });
    } finally {
      setCancelling(false);
    }
  };

  const handleResume = async () => {
    setResuming(true);
    try {
      await api.resumeSubscription();
      showToast('Prenumeration återupptagen', { type: 'success' });
      await loadSubscriptionData();
    } catch (error) {
      showToast(error.message || 'Kunde inte återuppta prenumeration', { type: 'error' });
    } finally {
      setResuming(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('sv-SE', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatAmount = (amount) => {
    return `${amount.toFixed(0)} kr`;
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

  const isPremium = licenseStatus?.license?.license_type === 'premium';
  const isActive = subscription?.status === 'active' || subscription?.status === 'trialing';

  return (
    <div className="space-y-6">
      {/* Subscription Status */}
      <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <CreditCard className="text-indigo-500" size={24} />
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
              Prenumeration
            </h3>
          </div>
          {isPremium && isActive && (
            <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg text-sm font-medium">
              Aktiv
            </span>
          )}
        </div>

        {isPremium ? (
          <div className="space-y-4">
            {subscription?.current_period_end && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="text-zinc-400" size={16} />
                <span className="text-zinc-600 dark:text-zinc-400">
                  Nästa fakturering: {formatDate(subscription.current_period_end)}
                </span>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              {subscription?.status === 'cancelled' ? (
                <button
                  onClick={handleResume}
                  disabled={resuming}
                  className={`px-4 py-2 ${getThemeButtonClass(colorTheme, 'primary')} rounded-lg text-sm font-medium disabled:opacity-50`}
                >
                  {resuming ? 'Återupptar...' : 'Återuppta prenumeration'}
                </button>
              ) : (
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="px-4 py-2 bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white rounded-lg text-sm font-medium hover:bg-zinc-300 dark:hover:bg-zinc-600 disabled:opacity-50"
                >
                  {cancelling ? 'Avbryter...' : 'Avbryt prenumeration'}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              Du har ingen aktiv Premium-prenumeration
            </p>
            <UpgradeToPremium />
          </div>
        )}
      </div>

      {/* Payment History */}
      {payments.length > 0 && (
        <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
            Betalningshistorik
          </h3>
          <div className="space-y-2">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {payment.status === 'succeeded' ? (
                      <CheckCircle className="text-emerald-500" size={18} />
                    ) : payment.status === 'failed' ? (
                      <XCircle className="text-rose-500" size={18} />
                    ) : (
                      <AlertCircle className="text-amber-500" size={18} />
                    )}
                    <span className="font-medium text-zinc-900 dark:text-white">
                      {formatAmount(payment.amount)}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      payment.status === 'succeeded'
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                        : payment.status === 'failed'
                        ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400'
                        : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                    }`}>
                      {payment.status === 'succeeded' ? 'Betalad' : payment.status === 'failed' ? 'Misslyckad' : 'Väntar'}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {formatDate(payment.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionManagement;

