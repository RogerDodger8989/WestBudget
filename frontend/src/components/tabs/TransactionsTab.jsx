import React, { useState, useMemo } from 'react';
import { Search, Filter, Import, ArrowDown, Download, Calendar } from 'lucide-react';
import TransactionItem from '../TransactionItem';
import DateRangeBtn from '../DateRangeBtn';

const TransactionsTab = ({ 
  transactions, 
  categories,
  setSelectedTransaction, 
  setEditingNoteTransactionId,
  setIsImportModalOpen,
  dateRange,
  setDateRange,
  getTitle,
  loading 
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Filtrera transaktioner baserat på sökfråga
  const filteredTransactions = useMemo(() => {
    if (!searchQuery.trim()) {
      return transactions;
    }

    const query = searchQuery.toLowerCase().trim();
    
    return transactions.filter(t => {
      // Sök i title
      if (t.title?.toLowerCase().includes(query)) return true;
      
      // Sök i amount (som sträng)
      if (t.amount?.toLowerCase().includes(query)) return true;
      
      // Sök i category
      if (t.category?.toLowerCase().includes(query)) return true;
      
      // Sök i note
      if (t.note?.toLowerCase().includes(query)) return true;
      
      // Sök i id (som sträng)
      if (String(t.id).includes(query)) return true;
      
      // Sök i date (formaterat)
      if (t.date?.toLowerCase().includes(query)) return true;
      
      // Sök i status
      if (t.status?.toLowerCase().includes(query)) return true;
      
      return false;
    });
  }, [transactions, searchQuery]);
  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
            {getTitle()}
          </h2>
          <div className="flex items-center gap-1 mt-2 bg-zinc-200 dark:bg-zinc-900/50 p-1 rounded-xl w-fit">
            <DateRangeBtn active={dateRange === 'month'} onClick={() => setDateRange('month')}>Denna Månad</DateRangeBtn>
            <DateRangeBtn active={dateRange === 'year'} onClick={() => setDateRange('year')}>Hela Året</DateRangeBtn>
            <DateRangeBtn active={dateRange === 'custom'} onClick={() => setDateRange('custom')} icon={<Calendar size={14} />}>Anpassad</DateRangeBtn>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm">
            <Download size={16} /> Exportera
          </button>
          <button className="bg-zinc-900 dark:bg-indigo-600 hover:bg-zinc-800 dark:hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-lg hover:shadow-xl active:scale-95">
            Ny Faktura
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/50 rounded-2xl flex flex-col shadow-sm dark:shadow-none overflow-hidden min-h-[600px]">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input 
                type="text" 
                placeholder="Sök titel, belopp, kategori, ID..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm w-full sm:w-64 focus:ring-2 focus:ring-indigo-500 outline-none" 
              />
            </div>
            <button className="p-2 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-500">
              <Filter size={18} />
            </button>
            <button 
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
            >
              <Import size={16} />
              Importera
            </button>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <select className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm rounded-lg px-3 py-2 outline-none">
              <option>Alla Kategorier</option>
              {categories.map(c => <option key={c}>{c}</option>)}
            </select>
            <select className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm rounded-lg px-3 py-2 outline-none">
              <option>Alla Statusar</option>
              <option>Bokförd</option>
              <option>Väntar</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-zinc-50 dark:bg-zinc-800/30 border-b border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
          <div className="col-span-3 flex items-center gap-1 cursor-pointer hover:text-zinc-800 dark:hover:text-zinc-300">
            Beskrivning <ArrowDown size={12} />
          </div>
          <div className="col-span-2">Datum</div>
          <div className="col-span-2 hidden sm:block">Kategori</div>
          <div className="col-span-1 hidden sm:flex justify-center">Notering</div>
          <div className="col-span-2 text-right">Belopp</div>
          <div className="col-span-1 hidden sm:block text-center">Status</div>
          <div className="col-span-1 hidden sm:block text-center">Kvitto</div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="text-center py-12">Laddar transaktioner...</div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              {searchQuery ? `Inga transaktioner matchar "${searchQuery}"` : 'Inga transaktioner hittades'}
            </div>
          ) : (
            filteredTransactions.map(t => (
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
  );
};

export default TransactionsTab;

