import React from 'react';
import { PieChart } from 'lucide-react';

const CategoryDistributionWidget = ({ widget, data }) => {
  const { showPercentages = true } = widget.config || {};
  const categories = data?.categories || [];

  if (categories.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
        <div className="text-center">
          <PieChart size={32} className="mx-auto text-zinc-400 mb-2" />
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Ingen data</p>
        </div>
      </div>
    );
  }

  const total = categories.reduce((sum, cat) => sum + (cat.amount || 0), 0);

  return (
    <div className="space-y-3">
      {categories.slice(0, 10).map((category, index) => {
        const percentage = total > 0 ? ((category.amount || 0) / total) * 100 : 0;
        const colors = [
          'bg-indigo-500', 'bg-emerald-500', 'bg-rose-500', 'bg-amber-500',
          'bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-cyan-500'
        ];
        const color = colors[index % colors.length];

        return (
          <div key={category.name || index} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-700 dark:text-zinc-300 font-medium">
                {category.name || 'Okänd kategori'}
              </span>
              <div className="flex items-center gap-2">
                {showPercentages && (
                  <span className="text-zinc-500 dark:text-zinc-400 text-xs">
                    {percentage.toFixed(1)}%
                  </span>
                )}
                <span className="text-zinc-900 dark:text-white font-semibold">
                  {category.amount ? `${category.amount.toLocaleString('sv-SE')} kr` : '0 kr'}
                </span>
              </div>
            </div>
            <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full ${color} transition-all duration-500`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CategoryDistributionWidget;

