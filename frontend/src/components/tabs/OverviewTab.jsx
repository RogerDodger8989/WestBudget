import React from 'react';
import { Wallet, PieChart, CreditCard } from 'lucide-react';
import StatCard from '../StatCard';
import TransactionItem from '../TransactionItem';

const OverviewTab = ({ 
  transactions, 
  setSelectedTransaction, 
  setEditingNoteTransactionId,
  setActiveTab,
  loading 
}) => {
  if (loading) {
    return <div className="text-center py-12">Laddar data...</div>;
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Total Omsättning" 
          amount="2,450,000 kr" 
          change="+12.5%" 
          trend="up" 
          icon={<Wallet className="text-emerald-500 dark:text-emerald-400" />} 
        />
        <StatCard 
          title="Utgående Moms" 
          amount="142,300 kr" 
          change="+2.1%" 
          trend="up" 
          icon={<PieChart className="text-indigo-500 dark:text-indigo-400" />} 
        />
        <StatCard 
          title="Kostnader" 
          amount="89,400 kr" 
          change="-4.3%" 
          trend="down" 
          icon={<CreditCard className="text-rose-500 dark:text-rose-400" />} 
        />
      </div>

      <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/50 rounded-2xl p-6 shadow-sm dark:shadow-none transition-colors duration-500">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Senaste Händelser</h3>
          <button 
            onClick={() => setActiveTab('transactions')}
            className="text-xs text-indigo-500 hover:text-indigo-400 font-medium"
          >
            Visa alla
          </button>
        </div>
        <div className="space-y-4">
          {transactions.slice(0, 5).map(t => (
            <TransactionItem 
              key={t.id} 
              data={t} 
              onClick={() => setSelectedTransaction(t)} 
              onEditNote={() => setEditingNoteTransactionId(t.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;

