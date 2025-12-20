import React from 'react';
import { TrendingUp, TrendingDown, Minus, BarChart } from 'lucide-react';
import { formatAmount } from '../../utils/formatAmount';

const KPIWidget = ({ widget, data }) => {
  const { label, value, trend, trendValue, iconName, color = 'indigo' } = widget.config || {};
  
  const displayValue = data?.value !== undefined ? formatAmount(data.value) : (value || '0 kr');
  const displayTrend = data?.trendValue !== undefined ? data.trendValue : trendValue;
  
  const colorClasses = {
    indigo: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
    emerald: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
    rose: 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400',
    amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  };

  // Map icon names to components
  const getIconComponent = () => {
    if (!iconName) return null;
    const iconMap = {
      TrendingUp,
      TrendingDown,
      BarChart,
    };
    const Icon = iconMap[iconName];
    return Icon ? <Icon size={18} /> : null;
  };

  const getTrendIcon = () => {
    if (displayTrend > 0) return <TrendingUp size={16} className="text-emerald-500" />;
    if (displayTrend < 0) return <TrendingDown size={16} className="text-rose-500" />;
    return <Minus size={16} className="text-zinc-400" />;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {iconName && (
            <div className={`p-2 rounded-lg ${colorClasses[color] || colorClasses.indigo}`}>
              {getIconComponent()}
            </div>
          )}
          <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            {label || 'KPI'}
          </span>
        </div>
        {displayTrend !== undefined && displayTrend !== null && (
          <div className="flex items-center gap-1">
            {getTrendIcon()}
            <span className={`text-xs font-medium ${
              displayTrend > 0 ? 'text-emerald-600 dark:text-emerald-400' :
              displayTrend < 0 ? 'text-rose-600 dark:text-rose-400' :
              'text-zinc-500 dark:text-zinc-400'
            }`}>
              {displayTrend > 0 ? '+' : ''}{displayTrend.toFixed(1)}%
            </span>
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-zinc-900 dark:text-white">
        {displayValue}
      </div>
    </div>
  );
};

export default KPIWidget;
