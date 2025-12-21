import React from 'react';
import { Target, Wallet, PiggyBank, Calendar } from 'lucide-react';
import { formatAmount } from '../../utils/formatAmount';
import { useTheme } from '../../contexts/ThemeContext';

const SavingsProgressWidget = ({ widget, data }) => {
  const { title, showGoals = true, showAccounts = true } = widget.config || {};
  const { colorTheme } = useTheme();
  
  const goals = data?.goals || [];
  const accounts = data?.accounts || [];
  
  // Filter active items
  const activeGoals = goals.filter(g => g.status === 'Aktiv');
  const activeAccounts = accounts.filter(a => a.status === 'Aktiv');
  
  // Calculate totals
  const totalGoals = activeGoals.reduce((sum, goal) => sum + (parseFloat(goal.current_amount) || 0), 0);
  const totalTarget = activeGoals.reduce((sum, goal) => sum + (parseFloat(goal.target_amount) || 0), 0);
  const totalAccounts = activeAccounts.reduce((sum, account) => sum + (parseFloat(account.balance) || 0), 0);
  const totalSavings = totalGoals + totalAccounts;
  
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
  const isDark = document.documentElement.classList.contains('dark');

  return (
    <div className="space-y-4">
      {title && (
        <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          {title}
        </h4>
      )}
      
      {/* Total Savings Summary */}
      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <PiggyBank size={20} className="text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Totalt Sparande</span>
          </div>
          <span className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
            {formatAmount(totalSavings)}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs text-emerald-600 dark:text-emerald-400">
          <div>
            <span className="font-medium">Mål:</span> {formatAmount(totalGoals)}
          </div>
          <div>
            <span className="font-medium">Konton:</span> {formatAmount(totalAccounts)}
          </div>
        </div>
      </div>

      {/* Goals Progress */}
      {showGoals && activeGoals.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            <Target size={14} />
            Sparmål ({activeGoals.length})
          </div>
          {activeGoals.slice(0, 5).map((goal) => {
            const current = parseFloat(goal.current_amount) || 0;
            const target = parseFloat(goal.target_amount) || 1;
            const progress = Math.min((current / target) * 100, 100);
            const remaining = Math.max(target - current, 0);
            const daysRemaining = goal.deadline 
              ? Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24))
              : null;

            return (
              <div key={goal.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                      {goal.name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      <span>{formatAmount(current)} / {formatAmount(target)}</span>
                      {goal.deadline && (
                        <>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <Calendar size={12} />
                            <span>
                              {daysRemaining !== null 
                                ? daysRemaining > 0 
                                  ? `${daysRemaining} dagar kvar`
                                  : 'Deadline passerad'
                                : goal.deadline}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-zinc-900 dark:text-white">
                      {progress.toFixed(0)}%
                    </p>
                    {remaining > 0 && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {formatAmount(remaining)} kvar
                      </p>
                    )}
                  </div>
                </div>
                <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${progress}%`,
                      backgroundColor: progress >= 100 
                        ? '#10b981' 
                        : themeColors.primary
                    }}
                  />
                </div>
              </div>
            );
          })}
          {activeGoals.length > 5 && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center">
              +{activeGoals.length - 5} fler mål
            </p>
          )}
        </div>
      )}

      {/* Accounts Summary */}
      {showAccounts && activeAccounts.length > 0 && (
        <div className="space-y-3 pt-2 border-t border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            <Wallet size={14} />
            Spar-konton ({activeAccounts.length})
          </div>
          <div className="space-y-2">
            {activeAccounts.slice(0, 3).map((account) => (
              <div key={account.id} className="flex items-center justify-between p-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                    {account.name}
                  </p>
                  {account.category && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {account.category}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {formatAmount(parseFloat(account.balance) || 0)}
                  </p>
                </div>
              </div>
            ))}
            {activeAccounts.length > 3 && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center">
                +{activeAccounts.length - 3} fler konton
              </p>
            )}
          </div>
        </div>
      )}

      {activeGoals.length === 0 && activeAccounts.length === 0 && (
        <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
          <PiggyBank size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">Inga aktiva spar-mål eller konton</p>
        </div>
      )}
    </div>
  );
};

export default SavingsProgressWidget;

