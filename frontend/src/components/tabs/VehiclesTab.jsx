import React, { useState, useMemo } from 'react';
import { Fuel, Wrench, Gauge, Car, Calendar, Download, Search } from 'lucide-react';
import StatCard from '../StatCard';
import TransactionItem from '../TransactionItem';
import DateRangeBtn from '../DateRangeBtn';
import { filterByDateRange } from '../../utils/filterByDateRange';

const VehiclesTab = ({ 
  transactions, 
  setSelectedTransaction, 
  setEditingNoteTransactionId,
  dateRange,
  setDateRange,
  getTitle,
  loading 
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Filtrera fordonsrelaterade transaktioner
  const vehicleTransactions = useMemo(() => {
    const categoryFiltered = transactions.filter(t => 
      ['Drivmedel', 'Underhåll', 'Försäkring', 'Resor'].includes(t.category)
    );
    // Applicera även datumfiltrering
    return filterByDateRange(categoryFiltered, dateRange);
  }, [transactions, dateRange]);

  // Filtrera baserat på sökfråga
  const filteredVehicleTransactions = useMemo(() => {
    if (!searchQuery.trim()) {
      return vehicleTransactions;
    }

    const query = searchQuery.toLowerCase().trim();
    
    return vehicleTransactions.filter(t => {
      if (t.title?.toLowerCase().includes(query)) return true;
      if (t.amount?.toLowerCase().includes(query)) return true;
      if (t.category?.toLowerCase().includes(query)) return true;
      if (t.note?.toLowerCase().includes(query)) return true;
      if (String(t.id).includes(query)) return true;
      if (t.date?.toLowerCase().includes(query)) return true;
      if (t.status?.toLowerCase().includes(query)) return true;
      return false;
    });
  }, [vehicleTransactions, searchQuery]);

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Drivmedelskostnad" amount="845 kr" change="+4.5%" trend="up" icon={<Fuel className="text-amber-500 dark:text-amber-400" />} />
        <StatCard title="Service & Underhåll" amount="4,200 kr" change="+150%" trend="up" icon={<Wrench className="text-rose-500 dark:text-rose-400" />} />
        <StatCard title="Milersättning" amount="1,450 kr" change="+8.2%" trend="up" icon={<Gauge className="text-indigo-500 dark:text-indigo-400" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/50 rounded-2xl p-6 shadow-sm dark:shadow-none">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-6 flex items-center gap-2">
            <Car size={18} className="text-indigo-500" /> Mina Fordon
          </h3>
          <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4 border border-zinc-100 dark:border-zinc-800 mb-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-bold text-zinc-900 dark:text-white">Volvo XC60</h4>
                <p className="text-xs text-zinc-500 uppercase font-mono mt-1">MLB 482</p>
              </div>
              <span className="px-2 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 text-xs font-bold rounded">AKTIV</span>
            </div>
            <div className="space-y-2 mt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">Mätarställning</span>
                <span className="text-zinc-700 dark:text-zinc-300 font-mono">14,230 mil</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Nästa besiktning</span>
                <span className="text-zinc-700 dark:text-zinc-300">2025-04-30</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Försäkring</span>
                <span className="text-zinc-700 dark:text-zinc-300">Hel, If</span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/50 rounded-2xl p-6 flex flex-col shadow-sm dark:shadow-none">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Fordonskostnader</h3>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input 
                type="text" 
                placeholder="Sök..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm w-48 focus:ring-2 focus:ring-indigo-500 outline-none" 
              />
            </div>
          </div>
          <div className="space-y-4 flex-1">
            {loading ? (
              <div className="text-center py-12">Laddar fordonskostnader...</div>
            ) : filteredVehicleTransactions.length === 0 ? (
              <div className="text-center py-12 text-zinc-500">
                {searchQuery ? `Inga fordonskostnader matchar "${searchQuery}"` : 'Inga fordonskostnader hittades'}
              </div>
            ) : (
              filteredVehicleTransactions.map(t => (
                <TransactionItem 
                  key={t.id} 
                  data={t} 
                  onClick={() => setSelectedTransaction(t)} 
                  onEditNote={() => setEditingNoteTransactionId(t.id)}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehiclesTab;

