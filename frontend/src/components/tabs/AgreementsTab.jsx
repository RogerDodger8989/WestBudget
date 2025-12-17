import React from 'react';
import { RefreshCw, FileText, AlertTriangle, Search, Filter, CalendarClock, Download } from 'lucide-react';
import StatCard from '../StatCard';

const AgreementsTab = ({ agreements, getTitle, loading }) => {
  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
            {getTitle()}
          </h2>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm">
            <Download size={16} /> Exportera
          </button>
          <button className="bg-zinc-900 dark:bg-indigo-600 hover:bg-zinc-800 dark:hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-lg hover:shadow-xl active:scale-95">
            Lägg till Avtal
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Fast Månadskostnad" 
          amount="9,543 kr" 
          change="+450 kr" 
          trend="up" 
          icon={<RefreshCw className="text-indigo-500 dark:text-indigo-400" />}
        />
        <StatCard 
          title="Aktiva Avtal" 
          amount="7 st" 
          change="1 uppsagd" 
          trend="down" 
          icon={<FileText className="text-emerald-500 dark:text-emerald-400" />}
        />
        <StatCard 
          title="Att omförhandla (30d)" 
          amount="2 st" 
          change="Kolla nu!" 
          trend="down"
          icon={<AlertTriangle className="text-amber-500 dark:text-amber-400" />}
        />
      </div>

      <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/50 rounded-2xl flex flex-col shadow-sm dark:shadow-none overflow-hidden min-h-[600px]">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input 
                type="text" 
                placeholder="Sök avtal, leverantör..." 
                className="pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm w-full sm:w-64 focus:ring-2 focus:ring-indigo-500 outline-none" 
              />
            </div>
            <button className="p-2 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-500">
              <Filter size={18} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-zinc-50 dark:bg-zinc-800/30 border-b border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
          <div className="col-span-4 sm:col-span-3">Tjänst / Leverantör</div>
          <div className="col-span-2 hidden sm:block">Kategori</div>
          <div className="col-span-3 sm:col-span-2">Kostnad</div>
          <div className="col-span-2 hidden sm:block">Nästa Betalning</div>
          <div className="col-span-3 sm:col-span-2 text-right">Status</div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="text-center py-12">Laddar avtal...</div>
          ) : (
            agreements.map(agreement => (
              <div key={agreement.id} className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors items-center group cursor-pointer">
                <div className="col-span-4 sm:col-span-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-lg shadow-sm border border-zinc-200 dark:border-zinc-700">
                    {agreement.icon}
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-semibold text-zinc-900 dark:text-white truncate">{agreement.name}</p>
                    <p className="text-xs text-zinc-500 truncate">{agreement.provider}</p>
                  </div>
                </div>

                <div className="col-span-2 hidden sm:block">
                  <span className="px-2 py-1 rounded text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                    {agreement.category}
                  </span>
                </div>

                <div className="col-span-3 sm:col-span-2">
                  <p className="font-bold text-zinc-900 dark:text-white">{agreement.cost} kr</p>
                  <p className="text-xs text-zinc-500">{agreement.frequency}</p>
                </div>

                <div className="col-span-2 hidden sm:block">
                  <div className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                    <CalendarClock size={14} className="text-zinc-400" />
                    {agreement.nextPayment}
                  </div>
                  {agreement.notice && (
                    <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">{agreement.notice}</p>
                  )}
                </div>

                <div className="col-span-3 sm:col-span-2 flex justify-end">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase border ${
                    agreement.status === 'Aktiv' 
                      ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' 
                      : agreement.status === 'Uppsagd'
                      ? 'bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-500 dark:border-zinc-700'
                      : 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
                  }`}>
                    {agreement.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AgreementsTab;

