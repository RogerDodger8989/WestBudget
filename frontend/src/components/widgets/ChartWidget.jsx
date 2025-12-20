import React from 'react';
import { BarChart3, LineChart, PieChart } from 'lucide-react';

const ChartWidget = ({ widget, data }) => {
  const { chartType = 'bar', title } = widget.config || {};
  
  // Placeholder for chart - you can integrate a charting library like recharts later
  const renderChart = () => {
    switch (chartType) {
      case 'line':
        return (
          <div className="h-48 flex items-center justify-center bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
            <div className="text-center">
              <LineChart size={32} className="mx-auto text-zinc-400 mb-2" />
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Linjediagram kommer snart</p>
            </div>
          </div>
        );
      case 'pie':
        return (
          <div className="h-48 flex items-center justify-center bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
            <div className="text-center">
              <PieChart size={32} className="mx-auto text-zinc-400 mb-2" />
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Cirkeldiagram kommer snart</p>
            </div>
          </div>
        );
      default: // bar
        return (
          <div className="h-48 flex items-center justify-center bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
            <div className="text-center">
              <BarChart3 size={32} className="mx-auto text-zinc-400 mb-2" />
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Stapeldiagram kommer snart</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-2">
      {title && (
        <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          {title}
        </h4>
      )}
      {renderChart()}
    </div>
  );
};

export default ChartWidget;

