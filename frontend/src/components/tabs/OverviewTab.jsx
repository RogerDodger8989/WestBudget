import React, { useMemo, useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, BarChart, Search, Calendar, Settings, Layout } from 'lucide-react';
import StatCard from '../StatCard';
import TransactionItem from '../TransactionItem';
import DateRangeBtn from '../DateRangeBtn';
import WidgetGrid from '../widgets/WidgetGrid';
import WidgetConfigModal from '../WidgetConfigModal';
import { formatAmount } from '../../utils/formatAmount';
import { filterByDateRange } from '../../utils/filterByDateRange';
import { api } from '../../api';
import { useToast } from '../../contexts/ToastContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getThemeButtonClass, getThemeTextClass } from '../../utils/getThemeClasses';

const OverviewTab = ({ 
  transactions, 
  setSelectedTransaction, 
  setEditingNoteTransactionId,
  setActiveTab,
  dateRange = 'month',
  setDateRange,
  customStartDate,
  customEndDate,
  setIsCustomDateModalOpen,
  loading 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [widgets, setWidgets] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isWidgetConfigOpen, setIsWidgetConfigOpen] = useState(false);
  const [editingWidget, setEditingWidget] = useState(null);
  const [loadingWidgets, setLoadingWidgets] = useState(true);
  const { showToast } = useToast();
  const { colorTheme } = useTheme();
  
  // Load widgets on mount
  useEffect(() => {
    loadWidgets();
  }, []);

  const loadWidgets = async () => {
    try {
      setLoadingWidgets(true);
      const savedWidgets = await api.getDashboardLayout();
      if (savedWidgets && savedWidgets.length > 0) {
        setWidgets(savedWidgets);
      } else {
        // Default widgets
        setWidgets([
          {
            id: '1',
            type: 'kpi',
            title: 'Inkomst',
            config: { label: 'Inkomst', color: 'emerald', iconName: 'TrendingUp' }
          },
          {
            id: '2',
            type: 'kpi',
            title: 'Utgifter',
            config: { label: 'Utgifter', color: 'rose', iconName: 'TrendingDown' }
          },
          {
            id: '3',
            type: 'kpi',
            title: 'Netto',
            config: { label: 'Netto', color: 'indigo', iconName: 'BarChart' }
          },
          {
            id: '4',
            type: 'transaction-list',
            title: 'Senaste Transaktioner',
            config: { limit: 5, showCategory: true }
          }
        ]);
      }
    } catch (error) {
      console.error('Kunde inte ladda widgets:', error);
      // Use default widgets on error
      setWidgets([
        {
          id: '1',
          type: 'kpi',
          title: 'Inkomst',
          config: { label: 'Inkomst', color: 'emerald', iconName: 'TrendingUp' }
        },
        {
          id: '2',
          type: 'kpi',
          title: 'Utgifter',
          config: { label: 'Utgifter', color: 'rose', iconName: 'TrendingDown' }
        },
        {
          id: '3',
          type: 'kpi',
          title: 'Netto',
          config: { label: 'Netto', color: 'indigo', iconName: 'BarChart' }
        }
      ]);
    } finally {
      setLoadingWidgets(false);
    }
  };

  const saveWidgets = async (widgetsToSave) => {
    try {
      await api.saveDashboardLayout(widgetsToSave);
      showToast('Dashboard sparad!', { type: 'success' });
    } catch (error) {
      console.error('Kunde inte spara widgets:', error);
      showToast('Kunde inte spara dashboard', { type: 'error' });
    }
  };

  const handleAddWidget = () => {
    setEditingWidget(null);
    setIsWidgetConfigOpen(true);
  };

  const handleEditWidget = (widget) => {
    setEditingWidget(widget);
    setIsWidgetConfigOpen(true);
  };

  const handleSaveWidget = (widgetData) => {
    if (editingWidget) {
      // Update existing widget
      const updatedWidgets = widgets.map(w => 
        w.id === editingWidget.id ? widgetData : w
      );
      setWidgets(updatedWidgets);
      saveWidgets(updatedWidgets);
    } else {
      // Add new widget
      const newWidgets = [...widgets, widgetData];
      setWidgets(newWidgets);
      saveWidgets(newWidgets);
    }
  };

  const handleRemoveWidget = (widgetId) => {
    const updatedWidgets = widgets.filter(w => w.id !== widgetId);
    setWidgets(updatedWidgets);
    saveWidgets(updatedWidgets);
    showToast('Widget borttagen', { type: 'success' });
  };

  const handleReorderWidgets = (newWidgets) => {
    setWidgets(newWidgets);
    saveWidgets(newWidgets);
  };

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

  // Filtrera transaktioner baserat på sökfråga (efter datumfiltrering)
  const filteredTransactions = useMemo(() => {
    if (!searchQuery.trim()) {
      return dateFilteredTransactions;
    }

    const query = searchQuery.toLowerCase().trim();
    
    return dateFilteredTransactions.filter(t => {
      if (t.title?.toLowerCase().includes(query)) return true;
      if (t.amount?.toLowerCase().includes(query)) return true;
      if (t.category?.toLowerCase().includes(query)) return true;
      if (t.note?.toLowerCase().includes(query)) return true;
      if (String(t.id).includes(query)) return true;
      if (t.date?.toLowerCase().includes(query)) return true;
      if (t.status?.toLowerCase().includes(query)) return true;
      return false;
    });
  }, [dateFilteredTransactions, searchQuery]);

  // Beräkna statistik från filtrerade transaktioner
  const stats = useMemo(() => {
    let inkomst = 0;
    let utgifter = 0;

    dateFilteredTransactions.forEach(t => {
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

    return {
      inkomst: formatAmount(inkomst),
      utgifter: formatAmount(utgifter),
      netto: formatAmount(netto),
      nettoValue: netto,
      inkomstValue: inkomst,
      utgifterValue: utgifter
    };
  }, [dateFilteredTransactions]);

  // Calculate category distribution
  const categoryDistribution = useMemo(() => {
    const categoryMap = {};
    dateFilteredTransactions.forEach(t => {
      if (t.type === 'expense') {
        const categoryName = typeof t.category === 'string' ? t.category : t.category?.name || 'Övrigt';
        const amountStr = t.amount.replace(/[^\d,.-]/g, '').replace(',', '');
        const amount = Math.abs(parseFloat(amountStr) || 0);
        categoryMap[categoryName] = (categoryMap[categoryName] || 0) + amount;
      }
    });
    return Object.entries(categoryMap)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [dateFilteredTransactions]);

  // Prepare widget data
  const widgetData = useMemo(() => {
    const data = {};
    widgets.forEach(widget => {
      switch (widget.type) {
        case 'kpi':
          if (widget.config?.label === 'Inkomst') {
            data[widget.id] = { value: stats.inkomstValue };
          } else if (widget.config?.label === 'Utgifter') {
            data[widget.id] = { value: stats.utgifterValue };
          } else if (widget.config?.label === 'Netto') {
            data[widget.id] = { value: stats.nettoValue };
          }
          break;
        case 'transaction-list':
          data[widget.id] = { transactions: filteredTransactions.filter(t => t != null) };
          break;
        case 'category-distribution':
          data[widget.id] = { categories: categoryDistribution };
          break;
        default:
          data[widget.id] = {};
      }
    });
    return data;
  }, [widgets, stats, filteredTransactions, categoryDistribution]);

  if (loading || loadingWidgets) {
    return <div className="text-center py-12">Laddar data...</div>;
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
            Ekonomisk Översikt
          </h2>
          <div className="flex items-center gap-1 mt-2 bg-zinc-200 dark:bg-zinc-900/50 p-1 rounded-xl w-fit">
            <DateRangeBtn active={dateRange === 'month'} onClick={() => setDateRange('month')}>Denna Månad</DateRangeBtn>
            <DateRangeBtn active={dateRange === 'lastMonth'} onClick={() => setDateRange('lastMonth')}>Föregående Månad</DateRangeBtn>
            <DateRangeBtn active={dateRange === 'year'} onClick={() => setDateRange('year')}>Hela Året</DateRangeBtn>
            <DateRangeBtn active={dateRange === 'custom'} onClick={() => setIsCustomDateModalOpen(true)} icon={<Calendar size={14} className={getThemeTextClass(colorTheme, false) + ' dark:' + getThemeTextClass(colorTheme, true)} />}>Anpassad</DateRangeBtn>
          </div>
        </div>
        <button
          onClick={() => {
            setIsEditMode(!isEditMode);
            if (isEditMode) {
              // Save when exiting edit mode
              saveWidgets(widgets);
            }
          }}
          className={`flex items-center gap-2 ${getThemeButtonClass(colorTheme, 'primary')} px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-lg hover:shadow-xl active:scale-95`}
        >
          {isEditMode ? (
            <>
              <Layout size={16} />
              Klar
            </>
          ) : (
            <>
              <Settings size={16} />
              Anpassa
            </>
          )}
        </button>
      </div>
      
      {/* Widget Grid */}
      <WidgetGrid
        widgets={widgets}
        onAddWidget={handleAddWidget}
        onRemoveWidget={handleRemoveWidget}
        onEditWidget={handleEditWidget}
        onReorderWidgets={handleReorderWidgets}
        widgetData={widgetData}
        onTransactionClick={setSelectedTransaction}
        onNoteClick={setEditingNoteTransactionId}
        isEditMode={isEditMode}
      />

      {/* Widget Config Modal */}
      {isWidgetConfigOpen && (
        <WidgetConfigModal
          isOpen={isWidgetConfigOpen}
          onClose={() => {
            setIsWidgetConfigOpen(false);
            setEditingWidget(null);
          }}
          widget={editingWidget}
          onSave={handleSaveWidget}
          availableData={{}}
        />
      )}
    </div>
  );
};

export default OverviewTab;

