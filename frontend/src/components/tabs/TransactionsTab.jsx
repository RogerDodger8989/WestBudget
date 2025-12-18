import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Filter, Import, ArrowDown, Download, Calendar, Undo2, Trash2 } from 'lucide-react';
import TransactionItem from '../TransactionItem';
import DateRangeBtn from '../DateRangeBtn';
import { api } from '../../api';
import { useToast } from '../../contexts/ToastContext';

const TransactionsTab = ({ 
  transactions, 
  categories,
  setSelectedTransaction, 
  setEditingNoteTransactionId,
  setIsImportModalOpen,
  dateRange,
  setDateRange,
  getTitle,
  loading,
  lastImportIds,
  onUndoLastImport,
  reloadData
}) => {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTransactions, setSelectedTransactions] = useState(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const selectAllCheckboxRef = useRef(null);

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

  const handleSelectAll = (checked) => {
    if (checked) {
      const allIds = new Set(filteredTransactions.map(t => t.id));
      setSelectedTransactions(allIds);
    } else {
      setSelectedTransactions(new Set());
    }
  };

  const handleToggleTransaction = (id) => {
    const newSelected = new Set(selectedTransactions);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedTransactions(newSelected);
  };

  const handleDeleteSelected = async () => {
    if (selectedTransactions.size === 0) {
      showToast('Välj minst en transaktion att radera', { type: 'error' });
      return;
    }

    const idsToDelete = Array.from(selectedTransactions);
    const transactionsToDelete = filteredTransactions.filter(t => idsToDelete.includes(t.id));
    
    // Save for undo
    const deletedTransactions = transactionsToDelete.map(t => ({ ...t }));

    setIsDeleting(true);
    try {
      // Delete all selected transactions
      const deletePromises = idsToDelete.map(id => api.deleteTransaction(id));
      await Promise.all(deletePromises);

      // Clear selection
      setSelectedTransactions(new Set());

      // Reload data
      if (reloadData) {
        await reloadData();
      }

      // Show toast with undo
      showToast(`${idsToDelete.length} transaktion${idsToDelete.length !== 1 ? 'er' : ''} raderade!`, {
        type: 'success',
        undo: true,
        undoAction: async () => {
          try {
            // Recreate deleted transactions
            const recreatePromises = deletedTransactions.map(t => {
              // Convert amount from display format (e.g., "-40 kr") to numeric string for API
              let amountValue = t.amount;
              if (typeof amountValue === 'string') {
                // Remove "kr", spaces, and convert comma to dot
                amountValue = amountValue.replace(/[^\d.,-]/g, '').replace(',', '.');
              }
              const numericAmount = parseFloat(amountValue);
              
              if (isNaN(numericAmount)) {
                throw new Error(`Ogiltigt belopp för transaktion "${t.title}"`);
              }
              
              return api.createTransaction({
                title: t.title,
                date: t.date,
                amount: numericAmount.toString(),
                type: t.type,
                category: t.category,
                status: t.status || 'Bokförd',
                note: t.note || '',
                receipt: t.receipt || false
              });
            });
            await Promise.all(recreatePromises);
            
            if (reloadData) {
              await reloadData();
            }
            
            showToast('Transaktioner återställda!', { type: 'success' });
          } catch (err) {
            showToast('Kunde inte återställa transaktioner: ' + (err.message || 'Okänt fel'), {
              type: 'error'
            });
          }
        },
        description: 'Klicka på Ångra för att återställa'
      });
    } catch (err) {
      console.error('❌ Kunde inte radera transaktioner:', err);
      showToast('Kunde inte radera transaktioner: ' + (err.message || 'Okänt fel'), {
        type: 'error'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const allSelected = filteredTransactions.length > 0 && 
    filteredTransactions.every(t => selectedTransactions.has(t.id));
  const someSelected = selectedTransactions.size > 0 && !allSelected;

  // Update indeterminate state of select all checkbox
  useEffect(() => {
    if (selectAllCheckboxRef.current) {
      selectAllCheckboxRef.current.indeterminate = someSelected;
    }
  }, [someSelected]);

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
            <DateRangeBtn active={dateRange === 'custom'} onClick={() => setDateRange('custom')} icon={<Calendar size={14} className="text-indigo-500 dark:text-indigo-400" />}>Anpassad</DateRangeBtn>
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
            {lastImportIds && lastImportIds.length > 0 && onUndoLastImport && (
              <button 
                onClick={() => onUndoLastImport()}
                className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                title={`Ångra senaste importen (${lastImportIds.length} transaktion${lastImportIds.length !== 1 ? 'er' : ''})`}
              >
                <Undo2 size={16} />
                Ångra import
              </button>
            )}
            {selectedTransactions.size > 0 && (
              <button 
                onClick={handleDeleteSelected}
                disabled={isDeleting}
                className="flex items-center gap-2 px-3 py-2 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg text-sm font-medium text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={`Radera ${selectedTransactions.size} valda transaktion${selectedTransactions.size !== 1 ? 'er' : ''}`}
              >
                <Trash2 size={16} />
                Radera valda ({selectedTransactions.size})
              </button>
            )}
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
          <div className="col-span-1 flex items-center">
            <input
              type="checkbox"
              ref={selectAllCheckboxRef}
              checked={allSelected}
              onChange={(e) => handleSelectAll(e.target.checked)}
              className="w-4 h-4 text-indigo-600 border-zinc-300 rounded focus:ring-indigo-500"
            />
          </div>
          <div className="col-span-2 flex items-center gap-1 cursor-pointer hover:text-zinc-800 dark:hover:text-zinc-300">
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
                isSelected={selectedTransactions.has(t.id)}
                onToggleSelect={() => handleToggleTransaction(t.id)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionsTab;

