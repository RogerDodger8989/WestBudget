import React, { useMemo, useState } from 'react';
import { TrendingUp, TrendingDown, BarChart, Search } from 'lucide-react';
import StatCard from '../StatCard';
import TransactionItem from '../TransactionItem';

const OverviewTab = ({ 
  transactions, 
  setSelectedTransaction, 
  setEditingNoteTransactionId,
  setActiveTab,
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
      if (t.title?.toLowerCase().includes(query)) return true;
      if (t.amount?.toLowerCase().includes(query)) return true;
      if (t.category?.toLowerCase().includes(query)) return true;
      if (t.note?.toLowerCase().includes(query)) return true;
      if (String(t.id).includes(query)) return true;
      if (t.date?.toLowerCase().includes(query)) return true;
      if (t.status?.toLowerCase().includes(query)) return true;
      return false;
    });
  }, [transactions, searchQuery]);

  // Beräkna statistik från transaktioner
  const stats = useMemo(() => {
    let inkomst = 0;
    let utgifter = 0;

    transactions.forEach(t => {
      // Extrahera numeriskt värde från amount-strängen (t.ex. "+12,500 kr" -> 12500)
      const amountStr = t.amount.replace(/[^\d,.-]/g, '').replace(',', '');
      const amount = parseFloat(amountStr) || 0;

      if (t.type === 'income') {
        inkomst += amount;
      } else if (t.type === 'expense') {
        utgifter += Math.abs(amount); // Säkerställ positivt värde
      }
    });

    const netto = inkomst - utgifter;

    // Formatera belopp med svensk formatering
    const formatAmount = (value) => {
      return new Intl.NumberFormat('sv-SE', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value) + ' kr';
    };

    return {
      inkomst: formatAmount(inkomst),
      utgifter: formatAmount(utgifter),
      netto: formatAmount(netto),
      nettoValue: netto
    };
  }, [transactions]);

  if (loading) {
    return <div className="text-center py-12">Laddar data...</div>;
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Inkomst" 
          amount={stats.inkomst} 
          change="" 
          trend="up" 
          icon={<TrendingUp className="text-emerald-500 dark:text-emerald-400" />} 
        />
        <StatCard 
          title="Utgifter" 
          amount={stats.utgifter} 
          change="" 
          trend="down" 
          icon={<TrendingDown className="text-rose-500 dark:text-rose-400" />} 
        />
        <StatCard 
          title="Netto" 
          amount={stats.netto} 
          change="" 
          trend={stats.nettoValue >= 0 ? "up" : "down"} 
          icon={<BarChart className="text-indigo-500 dark:text-indigo-400" />} 
        />
      </div>

      <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/50 rounded-2xl p-6 shadow-sm dark:shadow-none transition-colors duration-500">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Senaste Händelser</h3>
          <div className="flex items-center gap-3">
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
            <button 
              onClick={() => setActiveTab('transactions')}
              className="text-xs text-indigo-500 hover:text-indigo-400 font-medium"
            >
              Visa alla
            </button>
          </div>
        </div>
        <div className="space-y-4">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-8 text-zinc-500">
              {searchQuery ? `Inga transaktioner matchar "${searchQuery}"` : 'Inga transaktioner hittades'}
            </div>
          ) : (
            filteredTransactions.slice(0, 5).map(t => (
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

export default OverviewTab;

