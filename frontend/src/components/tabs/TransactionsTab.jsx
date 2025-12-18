import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Filter, Import, ArrowDown, Download, Calendar, Undo2, Trash2 } from 'lucide-react';
import TransactionItem from '../TransactionItem';
import DateRangeBtn from '../DateRangeBtn';
import { api } from '../../api';
import { useToast } from '../../contexts/ToastContext';
import { filterByDateRange } from '../../utils/filterByDateRange';
import { formatAmount } from '../../utils/formatAmount';

const TransactionsTab = ({ 
  transactions, 
  categories,
  setSelectedTransaction, 
  setEditingNoteTransactionId,
  setIsImportModalOpen,
  setIsAddTransactionModalOpen,
  dateRange,
  setDateRange,
  customStartDate,
  customEndDate,
  setIsCustomDateModalOpen,
  getTitle,
  loading,
  lastImportIds,
  onUndoLastImport,
  reloadData
}) => {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Alla Kategorier');
  const [selectedStatus, setSelectedStatus] = useState('Alla Statusar');
  const [selectedTransactions, setSelectedTransactions] = useState(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const selectAllCheckboxRef = useRef(null);

  // Filtrera transaktioner baserat på datum (sorteras redan i filterByDateRange)
  const dateFilteredTransactions = useMemo(() => {
    const filtered = filterByDateRange(transactions, dateRange, customStartDate, customEndDate);
    // Ytterligare sortering efter datum (nyaste först) om det behövs
    return filtered.sort((a, b) => {
      if (!a.date || !b.date) return 0;
      const dateA = parseInt(a.date.replace(/-/g, ''));
      const dateB = parseInt(b.date.replace(/-/g, ''));
      return dateB - dateA; // Descending order (newest first)
    });
  }, [transactions, dateRange, customStartDate, customEndDate]);

  // Filtrera transaktioner baserat på kategori och status (efter datumfiltrering)
  const categoryAndStatusFiltered = useMemo(() => {
    let filtered = dateFilteredTransactions;
    
    // Filtrera på kategori
    if (selectedCategory && selectedCategory !== 'Alla Kategorier') {
      filtered = filtered.filter(t => {
        const categoryName = typeof t.category === 'string' ? t.category : t.category?.name || '';
        return categoryName === selectedCategory;
      });
    }
    
    // Filtrera på status
    if (selectedStatus && selectedStatus !== 'Alla Statusar') {
      filtered = filtered.filter(t => {
        const statusName = t.status || '';
        return statusName === selectedStatus;
      });
    }
    
    return filtered;
  }, [dateFilteredTransactions, selectedCategory, selectedStatus]);

  // Filtrera transaktioner baserat på sökfråga (efter kategori/status-filtrering)
  const filteredTransactions = useMemo(() => {
    if (!searchQuery.trim()) {
      return categoryAndStatusFiltered;
    }

    const query = searchQuery.toLowerCase().trim();
    
    return categoryAndStatusFiltered.filter(t => {
      // Sök i title
      if (t.title?.toLowerCase().includes(query)) return true;
      
      // Sök i amount (som sträng)
      if (t.amount?.toLowerCase().includes(query)) return true;
      
      // Sök i category
      const categoryName = typeof t.category === 'string' ? t.category : t.category?.name || '';
      if (categoryName?.toLowerCase().includes(query)) return true;
      
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
  }, [categoryAndStatusFiltered, searchQuery]);

  // Calculate date range for filename
  const getDateRangeForFilename = () => {
    const now = new Date();
    let startDateStr, endDateStr;
    
    switch (dateRange) {
      case 'month': {
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        startDateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`;
        const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
        endDateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
        break;
      }
      case 'lastMonth': {
        const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthYear = lastMonthDate.getFullYear();
        const lastMonthMonth = lastMonthDate.getMonth();
        startDateStr = `${lastMonthYear}-${String(lastMonthMonth + 1).padStart(2, '0')}-01`;
        const lastMonthLastDay = new Date(lastMonthYear, lastMonthMonth + 1, 0).getDate();
        endDateStr = `${lastMonthYear}-${String(lastMonthMonth + 1).padStart(2, '0')}-${String(lastMonthLastDay).padStart(2, '0')}`;
        break;
      }
      case 'year': {
        const year = now.getFullYear();
        startDateStr = `${year}-01-01`;
        endDateStr = `${year}-12-31`;
        break;
      }
      case 'custom': {
        if (customStartDate && customEndDate) {
          startDateStr = customStartDate;
          endDateStr = customEndDate;
        } else {
          // If no custom dates, use all transactions date range
          if (filteredTransactions.length > 0) {
            const dates = filteredTransactions.map(t => t.date).filter(Boolean).sort();
            startDateStr = dates[0] || '';
            endDateStr = dates[dates.length - 1] || '';
          } else {
            startDateStr = '';
            endDateStr = '';
          }
        }
        break;
      }
      default: {
        // If no date range selected, use all transactions date range
        if (filteredTransactions.length > 0) {
          const dates = filteredTransactions.map(t => t.date).filter(Boolean).sort();
          startDateStr = dates[0] || '';
          endDateStr = dates[dates.length - 1] || '';
        } else {
          startDateStr = '';
          endDateStr = '';
        }
        break;
      }
    }
    
    // Format as YYYYMMDD
    const formatDate = (dateStr) => {
      if (!dateStr) return '';
      return dateStr.replace(/-/g, '');
    };
    
    return {
      start: formatDate(startDateStr),
      end: formatDate(endDateStr)
    };
  };

  // Export to CSV
  const handleExport = () => {
    if (filteredTransactions.length === 0) {
      showToast('Inga transaktioner att exportera', { type: 'info' });
      return;
    }

    const dateRangeForFilename = getDateRangeForFilename();
    const filename = `Westbudget Transaktionshistorik ${dateRangeForFilename.start}-${dateRangeForFilename.end}.csv`;

    // CSV headers (Swedish)
    const headers = ['Beskrivning', 'Datum', 'Kategori', 'Notering', 'Belopp', 'Status', 'Kvitto'];
    
    // Convert transactions to CSV rows
    const csvRows = [
      headers.join(','), // Header row
      ...filteredTransactions.map(transaction => {
        // Format amount - handle both string and number
        let amountValue = '';
        if (transaction.amount !== undefined && transaction.amount !== null) {
          if (typeof transaction.amount === 'number') {
            // If it's a number, format it with thousand separators and "kr"
            amountValue = formatAmount(transaction.amount);
          } else {
            // If it's a string, use it as is (already formatted)
            amountValue = String(transaction.amount);
          }
        }
        
        const row = [
          `"${(transaction.title || '').replace(/"/g, '""')}"`, // Escape quotes in CSV
          transaction.date || '',
          `"${(typeof transaction.category === 'string' ? transaction.category : transaction.category?.name || '').replace(/"/g, '""')}"`,
          `"${(transaction.note || '').replace(/"/g, '""')}"`,
          `"${amountValue.replace(/"/g, '""')}"`, // Escape quotes
          transaction.status || '',
          transaction.receipt ? 'Ja' : 'Nej'
        ];
        return row.join(',');
      })
    ];

    // Create CSV content
    const csvContent = csvRows.join('\n');
    
    // Create blob and download
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel UTF-8 support
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast(`Exporterade ${filteredTransactions.length} transaktioner`, { type: 'success' });
  };

  // Beräkna statistik från filtrerade transaktioner
  const stats = useMemo(() => {
    let inkomst = 0;
    let utgifter = 0;

    filteredTransactions.forEach(t => {
      // Extrahera numeriskt värde från amount-strängen (t.ex. "+12,500 kr" -> 12500)
      const amountStr = t.amount.replace(/[^\d,.-]/g, '').replace(',', '.');
      const amount = parseFloat(amountStr) || 0;

      if (t.type === 'income') {
        inkomst += amount;
      } else if (t.type === 'expense') {
        utgifter += Math.abs(amount); // Säkerställ positivt värde
      }
    });

    const netto = inkomst - utgifter;

    return {
      inkomst: formatAmount(inkomst),
      utgifter: formatAmount(utgifter),
      netto: formatAmount(netto),
      nettoValue: netto
    };
  }, [filteredTransactions]);

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
            <DateRangeBtn active={dateRange === 'lastMonth'} onClick={() => setDateRange('lastMonth')}>Föregående Månad</DateRangeBtn>
            <DateRangeBtn active={dateRange === 'year'} onClick={() => setDateRange('year')}>Hela Året</DateRangeBtn>
            <DateRangeBtn active={dateRange === 'custom'} onClick={() => setIsCustomDateModalOpen(true)} icon={<Calendar size={14} className="text-indigo-500 dark:text-indigo-400" />}>Anpassad</DateRangeBtn>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-2 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm"
          >
            <Import size={16} />
            Importera
          </button>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm"
          >
            <Download size={16} /> Exportera
          </button>
          <button 
            onClick={() => setIsAddTransactionModalOpen(true)}
            className="bg-zinc-900 dark:bg-indigo-600 hover:bg-zinc-800 dark:hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-lg hover:shadow-xl active:scale-95"
          >
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
          <div className="flex gap-2 w-full sm:w-auto items-center">
            {/* Kompakt översikt */}
            <div className="hidden md:flex items-center gap-3 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Inkomst:</span>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{stats.inkomst}</span>
              </div>
              <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-700"></div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Utgifter:</span>
                <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">{stats.utgifter}</span>
              </div>
              <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-700"></div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Netto:</span>
                <span className={`text-xs font-semibold ${stats.nettoValue >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {stats.netto}
                </span>
              </div>
            </div>
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 text-zinc-900 dark:text-zinc-100"
            >
              <option>Alla Kategorier</option>
              {categories && categories.map(c => {
                const categoryName = typeof c === 'string' ? c : c.name || c;
                return <option key={categoryName} value={categoryName}>{categoryName}</option>;
              })}
            </select>
            <select 
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 text-zinc-900 dark:text-zinc-100"
            >
              <option>Alla Statusar</option>
              <option value="Bokförd">Bokförd</option>
              <option value="Väntar">Väntar</option>
              <option value="Granskas">Granskas</option>
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
              {searchQuery ? `Inga transaktioner matchar "${searchQuery}"` : 
               selectedCategory !== 'Alla Kategorier' || selectedStatus !== 'Alla Statusar' 
                 ? 'Inga transaktioner matchar de valda filtren' 
                 : 'Inga transaktioner hittades'}
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

