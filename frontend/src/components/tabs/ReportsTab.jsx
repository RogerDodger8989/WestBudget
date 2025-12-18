import React from 'react';
import { Settings, Tag, Download, Calendar } from 'lucide-react';
import DateRangeBtn from '../DateRangeBtn';

const ReportsTab = ({ dateRange, setDateRange, getTitle, loading }) => {
  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
            {getTitle()}
          </h2>
          <div className="flex items-center gap-1 mt-2 bg-zinc-200 dark:bg-zinc-900/50 p-1 rounded-xl w-fit">
            <DateRangeBtn active={dateRange === 'month'} onClick={() => setDateRange('month')}>Denna Månad</DateRangeBtn>
            <DateRangeBtn active={dateRange === 'lastMonth'} onClick={() => setDateRange('lastMonth')}>Föregående Månad</DateRangeBtn>
            <DateRangeBtn active={dateRange === 'year'} onClick={() => setDateRange('year')}>Hela Året</DateRangeBtn>
            <DateRangeBtn active={dateRange === 'custom'} onClick={() => setDateRange('custom')} icon={<Calendar size={14} className="text-indigo-500 dark:text-indigo-400" />}>Anpassad</DateRangeBtn>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm">
            <Download size={16} /> Exportera
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/50 rounded-2xl p-6 shadow-sm dark:shadow-none">
        <div className="flex items-center justify-between mb-8">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Resultaträkning</h3>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500"></div><span className="text-zinc-500">Inkomster</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-rose-500"></div><span className="text-zinc-500">Utgifter</span></div>
          </div>
        </div>
        <div className="h-72 w-full flex items-end justify-between gap-4">
          {[45, 60, 35, 70, 50, 65, 55, 75, 45, 80, 60, 90].map((h, i) => (
            <div key={i} className="flex-1 flex gap-1 h-full items-end justify-center group relative">
              <div style={{ height: `${h}%` }} className="w-4 bg-emerald-500 rounded-t-sm opacity-80 group-hover:opacity-100 transition-all"></div>
              <div style={{ height: `${h * 0.6}%` }} className="w-4 bg-rose-500 rounded-t-sm opacity-80 group-hover:opacity-100 transition-all"></div>
              <div className="absolute -top-12 bg-zinc-800 text-white text-xs p-2 rounded opacity-0 group-hover:opacity-100 transition-all pointer-events-none">
                Netto: +{Math.round(h * 150)} kr
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-zinc-400 mt-4 border-t border-zinc-100 dark:border-zinc-800 pt-4 uppercase tracking-wider">
          <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>Maj</span><span>Jun</span>
          <span>Jul</span><span>Aug</span><span>Sep</span><span>Okt</span><span>Nov</span><span>Dec</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/50 rounded-2xl p-6 shadow-sm dark:shadow-none">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-6">Momsrapport (Kvartal 4)</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
              <span className="text-sm text-zinc-500">Utgående Moms (Försäljning)</span>
              <span className="font-mono font-medium text-zinc-900 dark:text-white">+ 42,500 kr</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
              <span className="text-sm text-zinc-500">Ingående Moms (Inköp)</span>
              <span className="font-mono font-medium text-zinc-900 dark:text-white">- 12,300 kr</span>
            </div>
            <div className="border-t border-dashed border-zinc-200 dark:border-zinc-700 my-4"></div>
            <div className="flex justify-between items-center">
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">Att betala:</span>
              <span className="font-mono text-xl font-bold text-indigo-600 dark:text-indigo-400">30,200 kr</span>
            </div>
            <button className="w-full mt-2 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-all">
              Exportera för Skatteverket
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/50 rounded-2xl p-6 shadow-sm dark:shadow-none">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Kostnadsfördelning</h3>
          <div className="space-y-3">
            <CategoryRow color="bg-indigo-500" label="Drift" percent="60%" value="45k" icon={<Settings size={14}/>} />
            <CategoryRow color="bg-zinc-300 dark:bg-zinc-700" label="Övrigt" percent="40%" value="30k" icon={<Tag size={14}/>} />
          </div>
        </div>
      </div>
    </div>
  );
};

const CategoryRow = ({ color, label, percent, value, icon }) => (
  <div className="flex items-center justify-between text-sm">
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${color}`}></div>
      <span className="text-zinc-600 dark:text-zinc-400">{label}</span>
    </div>
    <div className="flex items-center gap-3">
      <span className="text-xs font-bold text-zinc-400 dark:text-zinc-600">{percent}</span>
      <span className="font-medium text-zinc-900 dark:text-zinc-200">{value}</span>
    </div>
  </div>
);

export default ReportsTab;

