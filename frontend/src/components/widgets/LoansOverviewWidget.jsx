import React, { useMemo } from 'react';
import { Receipt, TrendingDown, Calendar, Percent } from 'lucide-react';
import { formatAmount } from '../../utils/formatAmount';
import { useTheme } from '../../contexts/ThemeContext';

const LoansOverviewWidget = ({ widget, data }) => {
  const { title, showDetails = true, maxLoans = 5 } = widget.config || {};
  const { colorTheme } = useTheme();
  
  const loans = data?.loans || [];
  
  // Filter active loans
  const activeLoans = loans.filter(l => l.status === 'Aktiv');
  
  // Calculate totals
  const totals = useMemo(() => {
    const totalDebt = activeLoans.reduce((sum, loan) => sum + (parseFloat(loan.current_balance) || 0), 0);
    const totalMonthlyPayment = activeLoans.reduce((sum, loan) => sum + (parseFloat(loan.monthly_payment) || 0), 0);
    const totalMonthlyInterest = activeLoans.reduce((sum, loan) => sum + (parseFloat(loan.interest_amount) || 0), 0);
    const totalPrincipal = activeLoans.reduce((sum, loan) => sum + (parseFloat(loan.principal_amount) || 0), 0);
    const totalPaid = totalPrincipal - totalDebt;
    const totalPaidPercent = totalPrincipal > 0 ? (totalPaid / totalPrincipal) * 100 : 0;
    
    return {
      totalDebt,
      totalMonthlyPayment,
      totalMonthlyInterest,
      totalPrincipal,
      totalPaid,
      totalPaidPercent
    };
  }, [activeLoans]);
  
  // Get theme colors
  const getThemeColor = () => {
    const colors = {
      indigo: { primary: '#6366f1', light: '#e0e7ff', dark: '#4338ca' },
      blue: { primary: '#3b82f6', light: '#dbeafe', dark: '#2563eb' },
      emerald: { primary: '#10b981', light: '#d1fae5', dark: '#059669' },
      purple: { primary: '#a855f7', light: '#e9d5ff', dark: '#7c3aed' },
      rose: { primary: '#f43f5e', light: '#ffe4e6', dark: '#e11d48' },
      amber: { primary: '#f59e0b', light: '#fef3c7', dark: '#d97706' }
    };
    return colors[colorTheme] || colors.indigo;
  };

  const themeColors = getThemeColor();

  // Calculate months remaining for each loan (simplified)
  const calculateMonthsRemaining = (loan) => {
    if (!loan.monthly_payment || parseFloat(loan.monthly_payment) === 0) return null;
    const balance = parseFloat(loan.current_balance) || 0;
    const monthlyPayment = parseFloat(loan.monthly_payment) || 0;
    if (monthlyPayment === 0) return null;
    return Math.ceil(balance / monthlyPayment);
  };

  return (
    <div className="space-y-4">
      {title && (
        <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          {title}
        </h4>
      )}
      
      {/* Total Debt Summary */}
      <div className="bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-900/20 dark:to-rose-800/20 rounded-xl p-4 border border-rose-200 dark:border-rose-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingDown size={20} className="text-rose-600 dark:text-rose-400" />
            <span className="text-sm font-medium text-rose-700 dark:text-rose-300">Total Skuld</span>
          </div>
          <span className="text-lg font-bold text-rose-700 dark:text-rose-300">
            {formatAmount(totals.totalDebt)}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs text-rose-600 dark:text-rose-400">
          <div>
            <span className="font-medium">Månadsbetalning:</span> {formatAmount(totals.totalMonthlyPayment)}
          </div>
          <div>
            <span className="font-medium">Månadsränta:</span> {formatAmount(totals.totalMonthlyInterest)}
          </div>
        </div>
        {totals.totalPrincipal > 0 && (
          <div className="mt-3 pt-3 border-t border-rose-200 dark:border-rose-800">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-rose-600 dark:text-rose-400">Återbetalt</span>
              <span className="text-xs font-bold text-rose-700 dark:text-rose-300">
                {totals.totalPaidPercent.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-rose-200 dark:bg-rose-900/50 rounded-full h-2 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 bg-rose-500 dark:bg-rose-600"
                style={{ width: `${Math.min(totals.totalPaidPercent, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Loans List */}
      {showDetails && activeLoans.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            <Receipt size={14} />
            Aktiva Lån ({activeLoans.length})
          </div>
          {activeLoans.slice(0, maxLoans).map((loan) => {
            const currentBalance = parseFloat(loan.current_balance) || 0;
            const principalAmount = parseFloat(loan.principal_amount) || 1;
            const paid = principalAmount - currentBalance;
            const paidPercent = (paid / principalAmount) * 100;
            const monthsRemaining = calculateMonthsRemaining(loan);
            const interestRate = parseFloat(loan.interest_rate) || 0;
            const monthlyPayment = parseFloat(loan.monthly_payment) || 0;

            return (
              <div key={loan.id} className="space-y-2 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                      {loan.name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      <span>{loan.lender}</span>
                      {loan.category && (
                        <>
                          <span>•</span>
                          <span>{loan.category}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-rose-600 dark:text-rose-400">
                      {formatAmount(currentBalance)}
                    </p>
                    {monthsRemaining !== null && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        ~{monthsRemaining} mån
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(paidPercent, 100)}%`,
                      backgroundColor: paidPercent >= 100 
                        ? '#10b981' 
                        : themeColors.primary
                    }}
                  />
                </div>
                
                {/* Loan Details */}
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="text-zinc-500 dark:text-zinc-400">Månadsbetalning</p>
                    <p className="font-medium text-zinc-900 dark:text-white">
                      {formatAmount(monthlyPayment)}
                    </p>
                  </div>
                  <div>
                    <p className="text-zinc-500 dark:text-zinc-400">Ränta</p>
                    <p className="font-medium text-zinc-900 dark:text-white flex items-center gap-1">
                      <Percent size={12} />
                      {interestRate.toFixed(2)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-zinc-500 dark:text-zinc-400">Återbetalt</p>
                    <p className="font-medium text-zinc-900 dark:text-white">
                      {paidPercent.toFixed(0)}%
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
          {activeLoans.length > maxLoans && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center">
              +{activeLoans.length - maxLoans} fler lån
            </p>
          )}
        </div>
      )}

      {activeLoans.length === 0 && (
        <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
          <Receipt size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">Inga aktiva lån</p>
        </div>
      )}
    </div>
  );
};

export default LoansOverviewWidget;

