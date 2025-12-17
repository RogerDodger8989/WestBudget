import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

const StatCard = ({ title, amount, change, trend, icon }) => (
  <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/50 p-6 rounded-2xl hover:border-indigo-500/30 dark:hover:border-zinc-700/50 transition-all duration-300 group shadow-sm dark:shadow-none hover:shadow-md">
    <div className="flex items-start justify-between mb-4">
      <div className="p-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-xl group-hover:scale-110 transition-transform duration-300">
        {React.cloneElement(icon, { size: 20 })}
      </div>
      <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${
        trend === 'up' 
          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' 
          : 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'
      }`}>
        {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
        {change}
      </div>
    </div>
    <div>
      <h3 className="text-zinc-500 dark:text-zinc-500 text-sm font-medium mb-1">{title}</h3>
      <p className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">{amount}</p>
    </div>
  </div>
);

export default StatCard;

