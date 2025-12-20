import React, { useState, useMemo, useRef } from 'react';
import { Fuel, Wrench, Gauge, Car, Calendar, Download, Search, Plus, Filter, Trash2, Check, Eye, MessageSquare } from 'lucide-react';
import StatCard from '../StatCard';
import DateRangeBtn from '../DateRangeBtn';
import VehicleExpenseFilterModal from '../VehicleExpenseFilterModal';
import { filterByDateRange } from '../../utils/filterByDateRange';
import { formatAmount, getAmountClassName } from '../../utils/formatAmount';
import { useToast } from '../../contexts/ToastContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getThemeButtonClass, getThemeBgClass, getThemeBorderClass, getThemeTextClass, getThemeRingClass } from '../../utils/getThemeClasses';
import { api } from '../../api';

const VehiclesTab = ({ 
  vehicles = [],
  vehicleExpenses = [],
  agreements = [],
  dateRange,
  setDateRange,
  customStartDate,
  customEndDate,
  setIsCustomDateModalOpen,
  getTitle,
  loading,
  onAddVehicle,
  onEditVehicle,
  onAddExpense,
  onEditExpense,
  onDeleteExpense,
  setEditingNoteVehicleExpenseId,
  reloadData
}) => {
  const { showToast } = useToast();
  const { colorTheme } = useTheme();
  
  // Helper function to get selected row classes
  const getSelectedRowClass = () => {
    const themeMap = {
      indigo: 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800',
      blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
      emerald: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
      purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
      rose: 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800',
      amber: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
    };
    return themeMap[colorTheme] || themeMap.indigo;
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [selectedExpenses, setSelectedExpenses] = useState(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    vehicle: 'all',
    category: 'all',
    minAmount: '',
    maxAmount: ''
  });
  const selectAllCheckboxRef = useRef(null);

  // Filtrera expenses baserat på datum
  const dateFilteredExpenses = useMemo(() => {
    return filterByDateRange(vehicleExpenses, dateRange, customStartDate, customEndDate);
  }, [vehicleExpenses, dateRange, customStartDate, customEndDate]);

  // Filtrera expenses baserat på filter (fordon, kategori, belopp)
  const filterFilteredExpenses = useMemo(() => {
    let filtered = [...dateFilteredExpenses];

    // Filtrera på fordon
    if (filters.vehicle !== 'all') {
      filtered = filtered.filter(e => e.vehicle_id === parseInt(filters.vehicle));
    }

    // Filtrera på kategori
    if (filters.category !== 'all') {
      filtered = filtered.filter(e => e.category === filters.category);
    }

    // Filtrera på belopp
    if (filters.minAmount) {
      const min = parseFloat(filters.minAmount);
      if (!isNaN(min)) {
        filtered = filtered.filter(e => Math.abs(parseFloat(e.amount) || 0) >= min);
      }
    }

    if (filters.maxAmount) {
      const max = parseFloat(filters.maxAmount);
      if (!isNaN(max)) {
        filtered = filtered.filter(e => Math.abs(parseFloat(e.amount) || 0) <= max);
      }
    }

    return filtered;
  }, [dateFilteredExpenses, filters]);

  // Filtrera baserat på sökfråga
  const filteredExpenses = useMemo(() => {
    if (!searchQuery.trim()) {
      return filterFilteredExpenses;
    }

    const query = searchQuery.toLowerCase().trim();
    
    return filterFilteredExpenses.filter(e => {
      const vehicle = vehicles.find(v => v.id === e.vehicle_id);
      if (vehicle?.make_model?.toLowerCase().includes(query)) return true;
      if (vehicle?.registration_number?.toLowerCase().includes(query)) return true;
      if (e.category?.toLowerCase().includes(query)) return true;
      if (e.description?.toLowerCase().includes(query)) return true;
      if (e.note?.toLowerCase().includes(query)) return true;
      if (String(e.amount).includes(query)) return true;
      if (e.date?.toLowerCase().includes(query)) return true;
      if (String(e.id).includes(query)) return true;
      return false;
    });
  }, [filterFilteredExpenses, searchQuery, vehicles]);

  // Beräkna statistik
  const stats = useMemo(() => {
    const fuel = filteredExpenses.filter(e => e.category === 'Drivmedel').reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    const service = filteredExpenses.filter(e => ['Service & Underhåll', 'Reparationer'].includes(e.category)).reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    const total = filteredExpenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    
    return { fuel, service, total };
  }, [filteredExpenses]);

  // Handle select all
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedExpenses(new Set(filteredExpenses.map(e => e.id)));
    } else {
      setSelectedExpenses(new Set());
    }
  };

  // Handle toggle expense selection
  const handleToggleExpense = (expenseId) => {
    setSelectedExpenses(prev => {
      const next = new Set(prev);
      if (next.has(expenseId)) {
        next.delete(expenseId);
      } else {
        next.add(expenseId);
      }
      return next;
    });
  };

  // Handle delete selected
  const handleDeleteSelected = async () => {
    if (selectedExpenses.size === 0) return;
    
    const confirmed = window.confirm(`Är du säker på att du vill radera ${selectedExpenses.size} kostnad(er)?`);
    if (!confirmed) return;

    setIsDeleting(true);
    const deletedIds = Array.from(selectedExpenses);
    const deletedExpenses = filteredExpenses.filter(e => deletedIds.includes(e.id));

    try {
      await Promise.all(deletedIds.map(id => api.deleteVehicleExpense(id)));
      
      showToast(`${deletedIds.length} kostnad(er) raderade`, {
        type: 'success',
        undo: true,
        undoAction: async () => {
          // Recreate deleted expenses
          for (const expense of deletedExpenses) {
            await api.createVehicleExpense({
              vehicle_id: expense.vehicle_id,
              category: expense.category,
              amount: expense.amount,
              date: expense.date,
              description: expense.description,
              note: expense.note,
              odometer_at_purchase: expense.odometer_at_purchase
            });
          }
          if (reloadData) reloadData();
        }
      });
      
      setSelectedExpenses(new Set());
      if (reloadData) reloadData();
    } catch (error) {
      console.error('Error deleting expenses:', error);
      showToast('Kunde inte radera kostnader', { type: 'error' });
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle CSV export
  const handleExportCSV = () => {
    if (filteredExpenses.length === 0) {
      showToast('Inga kostnader att exportera', { type: 'info' });
      return;
    }

    const startDate = customStartDate || (dateRange === 'month' ? new Date().toISOString().split('T')[0].slice(0, 7) + '-01' : '');
    const endDate = customEndDate || new Date().toISOString().split('T')[0];
    const filename = `Westbudget Fordonskostnader ${startDate.replace(/-/g, '')}-${endDate.replace(/-/g, '')}.csv`;

    const headers = ['Datum', 'Fordon', 'Registreringsnummer', 'Kategori', 'Belopp', 'Beskrivning', 'Mätarställning', 'Notering'];
    
    const csvRows = [
      headers.join(','),
      ...filteredExpenses.map(e => {
        const vehicle = vehicles.find(v => v.id === e.vehicle_id);
        const row = [
          e.date || '',
          `"${(vehicle?.make_model || '').replace(/"/g, '""')}"`,
          `"${(vehicle?.registration_number || '').replace(/"/g, '""')}"`,
          `"${(e.category || '').replace(/"/g, '""')}"`,
          e.amount || 0,
          `"${(e.description || '').replace(/"/g, '""')}"`,
          e.odometer_at_purchase || '',
          `"${(e.note || '').replace(/"/g, '""')}"`
        ];
        return row.join(',');
      })
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast(`Exporterade ${filteredExpenses.length} kostnader`, { type: 'success' });
  };

  // Handle PDF export
  const handleExportPDF = () => {
    if (filteredExpenses.length === 0) {
      showToast('Inga kostnader att exportera', { type: 'info' });
      return;
    }

    // Create HTML content for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>WestBudget Fordonskostnader Rapport</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .stats { margin: 20px 0; padding: 15px; background-color: #f9f9f9; border-radius: 5px; }
            .stats h3 { margin-top: 0; }
            .positive { color: #10b981; }
            .negative { color: #ef4444; }
          </style>
        </head>
        <body>
          <h1>WestBudget Fordonskostnader Rapport</h1>
          <p>Genererad: ${new Date().toLocaleDateString('sv-SE')}</p>
          
          <div class="stats">
            <h3>Sammanfattning</h3>
            <p><strong>Drivmedel:</strong> ${formatAmount(stats.fuel)}</p>
            <p><strong>Service & Underhåll:</strong> ${formatAmount(stats.service)}</p>
            <p><strong>Totalt:</strong> ${formatAmount(stats.total)}</p>
            <p><strong>Antal Kostnader:</strong> ${filteredExpenses.length} st</p>
          </div>

          <h2>Kostnadslista</h2>
          <table>
            <thead>
              <tr>
                <th>Datum</th>
                <th>Fordon</th>
                <th>Registreringsnummer</th>
                <th>Kategori</th>
                <th>Belopp</th>
                <th>Beskrivning</th>
                <th>Mätarställning</th>
              </tr>
            </thead>
            <tbody>
              ${filteredExpenses.map(e => {
                const vehicle = vehicles.find(v => v.id === e.vehicle_id);
                const amount = parseFloat(e.amount) || 0;
                const amountClass = amount >= 0 ? 'positive' : 'negative';
                return `
                  <tr>
                    <td>${e.date || ''}</td>
                    <td>${vehicle?.make_model || ''}</td>
                    <td>${vehicle?.registration_number || ''}</td>
                    <td>${e.category || ''}</td>
                    <td class="${amountClass}">${formatAmount(amount)}</td>
                    <td>${(e.description || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>
                    <td>${e.odometer_at_purchase || ''}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    // Open print dialog
    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Wait for content to load, then print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        showToast(`PDF-rapport genererad för ${filteredExpenses.length} kostnader`, { type: 'success' });
      }, 250);
    };
  };

  // Update indeterminate state
  React.useEffect(() => {
    if (selectAllCheckboxRef.current) {
      const total = filteredExpenses.length;
      const selected = selectedExpenses.size;
      selectAllCheckboxRef.current.indeterminate = selected > 0 && selected < total;
      selectAllCheckboxRef.current.checked = total > 0 && selected === total;
    }
  }, [selectedExpenses, filteredExpenses]);

  // Get vehicle for display
  const activeVehicles = vehicles.filter(v => v.status === 'Aktiv');

  return (
    <>
      {isFilterModalOpen && (
        <VehicleExpenseFilterModal
          isOpen={isFilterModalOpen}
          onClose={() => setIsFilterModalOpen(false)}
          vehicles={vehicles}
          filters={filters}
          onFiltersChange={setFilters}
        />
      )}
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
            <DateRangeBtn active={dateRange === 'custom'} onClick={() => setIsCustomDateModalOpen(true)} icon={<Calendar size={14} className={getThemeTextClass(colorTheme, false) + ' dark:' + getThemeTextClass(colorTheme, true)} />}>Anpassad</DateRangeBtn>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExportCSV}
            className={`flex items-center gap-2 ${getThemeButtonClass(colorTheme, 'primary')} px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-lg hover:shadow-xl active:scale-95`}
          >
            <Download size={16} /> Exportera CSV
          </button>
          <button
            onClick={handleExportPDF}
            className={`flex items-center gap-2 ${getThemeButtonClass(colorTheme, 'primary')} px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-lg hover:shadow-xl active:scale-95`}
          >
            <Download size={16} /> Exportera PDF
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Drivmedelskostnad" 
          amount={formatAmount(stats.fuel)} 
          icon={<Fuel className="text-amber-500 dark:text-amber-400" />} 
        />
        <StatCard 
          title="Service & Underhåll" 
          amount={formatAmount(stats.service)} 
          icon={<Wrench className="text-rose-500 dark:text-rose-400" />} 
        />
        <StatCard 
          title="Totalt" 
          amount={formatAmount(stats.total)} 
                  icon={<Gauge className={getThemeTextClass(colorTheme, false) + ' dark:' + getThemeTextClass(colorTheme, true)} />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mina Fordon */}
        <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/50 rounded-2xl p-6 shadow-sm dark:shadow-none">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Car size={18} className={getThemeTextClass(colorTheme, false)} /> Mina Fordon
            </h3>
            <button
              onClick={onAddVehicle}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              title="Lägg till fordon"
            >
              <Plus size={18} className={getThemeTextClass(colorTheme, false)} />
            </button>
          </div>
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8 text-zinc-500">Laddar fordon...</div>
            ) : activeVehicles.length === 0 ? (
              <div className="text-center py-8 text-zinc-500">
                <p className="mb-3">Inga fordon registrerade</p>
                <button
                  onClick={onAddVehicle}
                  className={`text-sm ${getThemeTextClass(colorTheme, false)} dark:${getThemeTextClass(colorTheme, true)} hover:underline`}
                >
                  Lägg till fordon
                </button>
              </div>
            ) : (
              activeVehicles.map(vehicle => (
                <div
                  key={vehicle.id}
                  onClick={() => {
                    setSelectedVehicleId(selectedVehicleId === vehicle.id ? null : vehicle.id);
                    onEditVehicle?.(vehicle);
                  }}
                  className={`bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4 border cursor-pointer transition-all ${
                    selectedVehicleId === vehicle.id
                      ? `${getThemeBorderClass(colorTheme)} ${getThemeBgClass(colorTheme, false)} dark:${getThemeBgClass(colorTheme, true)}`
                      : 'border-zinc-100 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-bold text-zinc-900 dark:text-white">{vehicle.make_model}</h4>
                      <p className="text-xs text-zinc-500 uppercase font-mono mt-1">{vehicle.registration_number}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-bold rounded ${
                      vehicle.status === 'Aktiv'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                        : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500'
                    }`}>
                      {vehicle.status}
                    </span>
                  </div>
                  <div className="space-y-1.5 mt-3 text-sm">
                    {vehicle.odometer > 0 && (
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Mätarställning</span>
                        <span className="text-zinc-700 dark:text-zinc-300 font-mono">{vehicle.odometer.toLocaleString('sv-SE')} mil</span>
                      </div>
                    )}
                    {vehicle.next_inspection && (
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Nästa besiktning</span>
                        <span className="text-zinc-700 dark:text-zinc-300">{vehicle.next_inspection}</span>
                      </div>
                    )}
                    {vehicle.agreement_id && agreements && (
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Försäkringsavtal</span>
                          <span className={`${getThemeTextClass(colorTheme, false)} dark:${getThemeTextClass(colorTheme, true)} font-medium`}>
                          {agreements.find(a => a.id === vehicle.agreement_id)?.name || 'Okänt avtal'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Fordonskostnader */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/50 rounded-2xl p-6 flex flex-col shadow-sm dark:shadow-none">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Fordonskostnader</h3>
            <div className="flex items-center gap-2">
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
                onClick={() => setIsFilterModalOpen(true)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm relative ${
                  filters.vehicle !== 'all' || filters.category !== 'all' || filters.minAmount || filters.maxAmount
                    ? getThemeButtonClass(colorTheme, 'primary')
                    : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700'
                }`}
              >
                <Filter size={16} />
                {(filters.vehicle !== 'all' || filters.category !== 'all' || filters.minAmount || filters.maxAmount) && (
                  <span className={`absolute -top-1 -right-1 w-2.5 h-2.5 bg-white rounded-full border-2 ${getThemeBorderClass(colorTheme)}`} />
                )}
              </button>
              <button
                onClick={onAddExpense}
                className={`flex items-center gap-2 ${getThemeButtonClass(colorTheme, 'primary')} px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-lg hover:shadow-xl active:scale-95`}
              >
                <Plus size={16} /> Lägg till utgift
              </button>
            </div>
          </div>

          {/* Bulk actions */}
          {selectedExpenses.size > 0 && (
            <div className={`mb-4 p-3 ${getThemeBgClass(colorTheme, false)} dark:${getThemeBgClass(colorTheme, true)} border ${getThemeBorderClass(colorTheme)} rounded-xl flex items-center justify-between`}>
              <span className={`text-sm ${getThemeTextClass(colorTheme, false)} dark:${getThemeTextClass(colorTheme, true)}`}>
                {selectedExpenses.size} vald(a)
              </span>
              <button
                onClick={handleDeleteSelected}
                disabled={isDeleting}
                className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-500 disabled:opacity-50 transition-all flex items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Raderar...
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    Radera valda
                  </>
                )}
              </button>
            </div>
          )}

          <div className="space-y-2 flex-1 overflow-y-auto">
            {loading ? (
              <div className="text-center py-12 text-zinc-500">Laddar fordonskostnader...</div>
            ) : filteredExpenses.length === 0 ? (
              <div className="text-center py-12 text-zinc-500">
                {searchQuery ? `Inga kostnader matchar "${searchQuery}"` : 'Inga fordonskostnader hittades'}
                {!searchQuery && (
                  <button
                    onClick={onAddExpense}
                    className={`block mt-3 text-sm ${getThemeTextClass(colorTheme, false)} dark:${getThemeTextClass(colorTheme, true)} hover:underline mx-auto`}
                  >
                    Lägg till första kostnaden
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {/* Header with checkbox */}
                <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-800">
                  <div className="col-span-1">
                    <input
                      ref={selectAllCheckboxRef}
                      type="checkbox"
                      onChange={handleSelectAll}
                      className={`w-4 h-4 ${getThemeTextClass(colorTheme, false)} rounded border-zinc-300 ${getThemeRingClass(colorTheme)}`}
                    />
                  </div>
                  <div className="col-span-2">Datum</div>
                  <div className="col-span-2">Fordon</div>
                  <div className="col-span-2">Kategori</div>
                  <div className="col-span-2 text-right">Belopp</div>
                  <div className="col-span-1 text-center">Notering</div>
                  <div className="col-span-1 text-right">Åtgärder</div>
                </div>

                {/* Expense rows */}
                {filteredExpenses.map(expense => {
                  const vehicle = vehicles.find(v => v.id === expense.vehicle_id);
                  const isSelected = selectedExpenses.has(expense.id);
                  
                  return (
                    <div
                      key={expense.id}
                      className={`grid grid-cols-12 gap-4 px-4 py-3 rounded-xl border transition-all ${
                        isSelected
                          ? getSelectedRowClass()
                          : 'bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                      }`}
                    >
                      <div className="col-span-1 flex items-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleExpense(expense.id)}
                          onClick={(e) => e.stopPropagation()}
                          className={`w-4 h-4 ${getThemeTextClass(colorTheme, false)} rounded border-zinc-300 ${getThemeRingClass(colorTheme)}`}
                        />
                      </div>
                      <div className="col-span-2 flex items-center text-sm text-zinc-700 dark:text-zinc-300">
                        {expense.date}
                      </div>
                      <div className="col-span-2 flex items-center">
                        <div>
                          <div className="text-sm font-medium text-zinc-900 dark:text-white">
                            {vehicle?.make_model || 'Okänt fordon'}
                          </div>
                          <div className="text-xs text-zinc-500 font-mono">
                            {vehicle?.registration_number || ''}
                          </div>
                        </div>
                      </div>
                      <div className="col-span-2 flex items-center text-sm text-zinc-700 dark:text-zinc-300">
                        {expense.category}
                      </div>
                      <div className={`col-span-2 text-right text-sm font-medium ${getAmountClassName(-expense.amount)}`}>
                        {formatAmount(-expense.amount)}
                      </div>
                      {/* Notering-kolumn */}
                      <div className="col-span-1 flex justify-center">
                        {(() => {
                          const hasNote = expense.note && expense.note.trim().length > 0;
                          
                          return (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (setEditingNoteVehicleExpenseId) {
                                  setEditingNoteVehicleExpenseId(expense.id);
                                }
                              }}
                              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                                hasNote
                                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:scale-110 cursor-pointer'
                                  : `bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-pointer ${
                                    colorTheme === 'indigo' ? 'hover:bg-indigo-100 dark:hover:bg-indigo-900/30 hover:text-indigo-500' :
                                    colorTheme === 'blue' ? 'hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-500' :
                                    colorTheme === 'emerald' ? 'hover:bg-emerald-100 dark:hover:bg-emerald-900/30 hover:text-emerald-500' :
                                    colorTheme === 'purple' ? 'hover:bg-purple-100 dark:hover:bg-purple-900/30 hover:text-purple-500' :
                                    colorTheme === 'rose' ? 'hover:bg-rose-100 dark:hover:bg-rose-900/30 hover:text-rose-500' :
                                    'hover:bg-amber-100 dark:hover:bg-amber-900/30 hover:text-amber-500'
                                  }`
                              }`}
                              title={hasNote ? expense.note : "Lägg till notering"}
                            >
                              {hasNote ? <Check size={14} /> : <Plus size={14} />}
                            </button>
                          );
                        })()}
                      </div>
                      <div className="col-span-1 flex items-center justify-end">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditExpense?.(expense);
                          }}
                          className={`text-xs ${getThemeTextClass(colorTheme, false)} dark:${getThemeTextClass(colorTheme, true)} hover:underline`}
                        >
                          Redigera
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default VehiclesTab;
