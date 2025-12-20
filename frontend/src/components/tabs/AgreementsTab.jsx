import React, { useState, useMemo, useRef } from 'react';
import { formatAmount } from '../../utils/formatAmount';
import { RefreshCw, FileText, AlertTriangle, Search, Filter, CalendarClock, Download, Plus, CheckCircle2, Check, ArrowUp, ArrowDown, ChevronUp, ChevronDown, Trash2 } from 'lucide-react';
import StatCard from '../StatCard';
import ImageLightbox from '../ImageLightbox';
import AgreementFilterModal from '../AgreementFilterModal';
import { useToast } from '../../contexts/ToastContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getThemeButtonClass, getThemeBgClass, getThemeBorderClass, getThemeTextClass } from '../../utils/getThemeClasses';
import { api } from '../../api';

const AgreementsTab = ({ agreements, getTitle, loading, categories, onAddAgreement, setSelectedAgreement, setEditingNoteAgreementId, reloadData, vehicles = [] }) => {
  const { showToast } = useToast();
  const { colorTheme } = useTheme();
  const [lightboxImages, setLightboxImages] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    frequency: 'all',
    hasImages: 'all',
    hasNotice: 'all',
    minCost: '',
    maxCost: ''
  });
  const [sortColumn, setSortColumn] = useState(null); // 'cost', 'nextPayment', 'provider', 'category'
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' or 'desc'
  const [selectedAgreements, setSelectedAgreements] = useState(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const selectAllCheckboxRef = useRef(null);

  // Parse images from agreement
  const parseImages = (imagesData) => {
    if (!imagesData) return [];
    if (Array.isArray(imagesData)) return imagesData;
    try {
      return JSON.parse(imagesData);
    } catch {
      return [];
    }
  };

  // Filtrera avtal baserat på sökfråga och filter
  const filteredAgreements = useMemo(() => {
    let filtered = [...agreements];

    // Applicera filter
    filtered = filtered.filter(a => {
      // Status filter
      if (filters.status !== 'all' && a.status !== filters.status) {
        return false;
      }

      // Category filter
      if (filters.category !== 'all' && a.category !== filters.category) {
        return false;
      }

      // Frequency filter
      if (filters.frequency !== 'all' && a.frequency !== filters.frequency) {
        return false;
      }

      // Has images filter
      if (filters.hasImages !== 'all') {
        const hasImages = parseImages(a.images).length > 0;
        if (filters.hasImages === 'yes' && !hasImages) return false;
        if (filters.hasImages === 'no' && hasImages) return false;
      }

      // Has notice filter
      if (filters.hasNotice !== 'all') {
        const hasNotice = a.notice && a.notice.trim().length > 0;
        if (filters.hasNotice === 'yes' && !hasNotice) return false;
        if (filters.hasNotice === 'no' && hasNotice) return false;
      }

      // Cost range filter
      const cost = parseFloat(a.cost) || 0;
      if (filters.minCost && cost < parseFloat(filters.minCost)) {
        return false;
      }
      if (filters.maxCost && cost > parseFloat(filters.maxCost)) {
        return false;
      }

      return true;
    });

    // Applicera sökfråga
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      
      filtered = filtered.filter(a => {
        // Sök i name
        if (a.name?.toLowerCase().includes(query)) return true;
        
        // Sök i provider
        if (a.provider?.toLowerCase().includes(query)) return true;
        
        // Sök i cost (som sträng)
        if (String(a.cost)?.toLowerCase().includes(query)) return true;
        
        // Sök i category
        if (a.category?.toLowerCase().includes(query)) return true;
        
        // Sök i notice
        if (a.notice?.toLowerCase().includes(query)) return true;
        
        // Sök i id (som sträng)
        if (String(a.id).includes(query)) return true;
        
        // Sök i status
        if (a.status?.toLowerCase().includes(query)) return true;
        
        // Sök i frequency
        if (a.frequency?.toLowerCase().includes(query)) return true;
        
        return false;
      });
    }

    return filtered;
  }, [agreements, searchQuery, filters]);

  // Sortera filtrerade avtal
  const sortedAgreements = useMemo(() => {
    if (!sortColumn) return filteredAgreements;
    
    const sorted = [...filteredAgreements].sort((a, b) => {
      let comparison = 0;
      
      switch (sortColumn) {
        case 'cost':
          comparison = (parseFloat(a.cost) || 0) - (parseFloat(b.cost) || 0);
          break;
        case 'nextPayment': {
          const dateA = a.next_payment || a.nextPayment || '';
          const dateB = b.next_payment || b.nextPayment || '';
          if (!dateA && !dateB) comparison = 0;
          else if (!dateA) comparison = 1;
          else if (!dateB) comparison = -1;
          else comparison = dateA.localeCompare(dateB);
          break;
        }
        case 'provider':
          comparison = (a.provider || '').localeCompare(b.provider || '');
          break;
        case 'category':
          comparison = (a.category || '').localeCompare(b.category || '');
          break;
        default:
          return 0;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    return sorted;
  }, [filteredAgreements, sortColumn, sortDirection]);

  // Hantera sortering
  const handleSort = (column) => {
    if (sortColumn === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New column, default to ascending
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Hantera val av alla avtal
  const handleSelectAll = (checked) => {
    if (checked) {
      const allIds = new Set(sortedAgreements.map(a => a.id));
      setSelectedAgreements(allIds);
    } else {
      setSelectedAgreements(new Set());
    }
  };

  // Hantera val av enskilt avtal
  const handleToggleAgreement = (id) => {
    const newSelected = new Set(selectedAgreements);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedAgreements(newSelected);
  };

  // Radera valda avtal
  const handleDeleteSelected = async () => {
    if (selectedAgreements.size === 0) {
      showToast('Välj minst ett avtal att radera', { type: 'info' });
      return;
    }

    const idsToDelete = Array.from(selectedAgreements);
    const agreementsToDelete = sortedAgreements.filter(a => idsToDelete.includes(a.id));
    
    // Bekräfta radering
    const confirmed = window.confirm(
      `Är du säker på att du vill radera ${idsToDelete.length} avtal?\n\n` +
      agreementsToDelete.map(a => `• ${a.name}`).join('\n') +
      '\n\nDetta kan inte ångras.'
    );
    
    if (!confirmed) return;

    // Save for undo
    const deletedAgreements = agreementsToDelete.map(a => ({ ...a }));

    setIsDeleting(true);
    try {
      // Delete all selected agreements
      const deletePromises = idsToDelete.map(id => api.deleteAgreement(id));
      await Promise.all(deletePromises);

      // Clear selection
      setSelectedAgreements(new Set());

      // Reload data
      if (reloadData) {
        await reloadData();
      }

      // Show toast with undo
      showToast(`${idsToDelete.length} avtal raderade!`, {
        type: 'success',
        undo: true,
        undoAction: async () => {
          try {
            // Recreate all deleted agreements
            const recreatePromises = deletedAgreements.map(agreement => 
              api.createAgreement({
                name: agreement.name,
                provider: agreement.provider,
                cost: agreement.cost,
                frequency: agreement.frequency,
                next_payment: agreement.next_payment || agreement.nextPayment,
                status: agreement.status,
                category: agreement.category,
                icon: agreement.icon,
                notice: agreement.notice,
                start_date: agreement.start_date,
                end_date: agreement.end_date,
                images: agreement.images
              })
            );
            await Promise.all(recreatePromises);
            
            if (reloadData) {
              await reloadData();
            }
            
            showToast('Radering ångrad', { type: 'success' });
          } catch (err) {
            console.error('Kunde inte ångra radering:', err);
            showToast('Kunde inte ångra radering', { type: 'error' });
          }
        }
      });
    } catch (error) {
      console.error('❌ Kunde inte radera avtal:', error);
      showToast('Kunde inte radera avtal. Försök igen.', { type: 'error' });
    } finally {
      setIsDeleting(false);
    }
  };

  // Beräkna statistik baserat på filtrerade avtal
  const filteredStats = useMemo(() => {
    const activeFilteredAgreements = sortedAgreements.filter(a => a.status === 'Aktiv');
    const totalMonthlyCost = activeFilteredAgreements.reduce((sum, a) => {
      const cost = parseFloat(a.cost) || 0;
      // Convert to monthly if needed
      let monthlyCost = cost;
      if (a.frequency === 'Kvartalsvis') monthlyCost = cost / 3;
      else if (a.frequency === 'Årligen') monthlyCost = cost / 12;
      return sum + monthlyCost;
    }, 0);
    
    const totalYearlyCost = activeFilteredAgreements.reduce((sum, a) => {
      const cost = parseFloat(a.cost) || 0;
      // Convert to yearly if needed
      let yearlyCost = cost;
      if (a.frequency === 'Månadsvis') yearlyCost = cost * 12;
      else if (a.frequency === 'Kvartalsvis') yearlyCost = cost * 4;
      return sum + yearlyCost;
    }, 0);

    return {
      totalMonthlyCost,
      totalYearlyCost
    };
  }, [sortedAgreements]);

  // Beräkna statistik (alla aktiva avtal)
  const stats = useMemo(() => {
    const activeAgreements = agreements.filter(a => a.status === 'Aktiv');
    const totalMonthlyCost = activeAgreements.reduce((sum, a) => {
      const cost = parseFloat(a.cost) || 0;
      // Convert to monthly if needed
      let monthlyCost = cost;
      if (a.frequency === 'Kvartalsvis') monthlyCost = cost / 3;
      else if (a.frequency === 'Årligen') monthlyCost = cost / 12;
      return sum + monthlyCost;
    }, 0);
    
    const totalYearlyCost = activeAgreements.reduce((sum, a) => {
      const cost = parseFloat(a.cost) || 0;
      // Convert to yearly if needed
      let yearlyCost = cost;
      if (a.frequency === 'Månadsvis') yearlyCost = cost * 12;
      else if (a.frequency === 'Kvartalsvis') yearlyCost = cost * 4;
      return sum + yearlyCost;
    }, 0);

    // Cost per category (both monthly and yearly)
    const costByCategory = {};
    activeAgreements.forEach(a => {
      const cost = parseFloat(a.cost) || 0;
      
      // Calculate monthly cost
      let monthlyCost = cost;
      if (a.frequency === 'Kvartalsvis') monthlyCost = cost / 3;
      else if (a.frequency === 'Årligen') monthlyCost = cost / 12;
      
      // Calculate yearly cost
      let yearlyCost = cost;
      if (a.frequency === 'Månadsvis') yearlyCost = cost * 12;
      else if (a.frequency === 'Kvartalsvis') yearlyCost = cost * 4;
      
      const category = a.category || 'Övrigt';
      if (!costByCategory[category]) {
        costByCategory[category] = { monthly: 0, yearly: 0 };
      }
      costByCategory[category].monthly += monthlyCost;
      costByCategory[category].yearly += yearlyCost;
    });

    return {
      totalMonthlyCost,
      totalYearlyCost,
      activeCount: activeAgreements.length,
      costByCategory
    };
  }, [agreements]);

  // Export to CSV
  const handleExport = () => {
    if (sortedAgreements.length === 0) {
      showToast('Inga avtal att exportera', { type: 'info' });
      return;
    }

    const now = new Date();
    const year = now.getFullYear();
    const filename = `Westbudget Avtal ${year}.csv`;

    // CSV headers (Swedish)
    const headers = ['Tjänst', 'Leverantör', 'Kategori', 'Kostnad', 'Frekvens', 'Nästa Betalning', 'Status', 'Startdatum', 'Slutdatum', 'Notering'];
    
    // Convert agreements to CSV rows
    const csvRows = [
      headers.join(','), // Header row
      ...sortedAgreements.map(agreement => {
        const row = [
          `"${(agreement.name || '').replace(/"/g, '""')}"`,
          `"${(agreement.provider || '').replace(/"/g, '""')}"`,
          `"${(agreement.category || '').replace(/"/g, '""')}"`,
          agreement.cost || '',
          agreement.frequency || '',
          agreement.next_payment || agreement.nextPayment || '',
          agreement.status || '',
          agreement.start_date || '',
          agreement.end_date || '',
          `"${(agreement.notice || '').replace(/"/g, '""')}"`
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
    
    showToast(`Exporterade ${sortedAgreements.length} avtal`, { type: 'success' });
  };

  // Export to PDF
  const handleExportPDF = () => {
    if (sortedAgreements.length === 0) {
      showToast('Inga avtal att exportera', { type: 'info' });
      return;
    }

    // Create HTML content for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>WestBudget Avtal Rapport</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .stats { margin: 20px 0; padding: 15px; background-color: #f9f9f9; border-radius: 5px; }
            .stats h3 { margin-top: 0; }
          </style>
        </head>
        <body>
          <h1>WestBudget Avtal Rapport</h1>
          <p>Genererad: ${new Date().toLocaleDateString('sv-SE')}</p>
          
          <div class="stats">
            <h3>Sammanfattning</h3>
            <p><strong>Total Månadskostnad:</strong> ${formatAmount(stats.totalMonthlyCost)}</p>
            <p><strong>Total Årskostnad:</strong> ${formatAmount(stats.totalYearlyCost)}</p>
            <p><strong>Aktiva Avtal:</strong> ${stats.activeCount} st</p>
          </div>

          <h2>Avtalslista</h2>
          <table>
            <thead>
              <tr>
                <th>Tjänst</th>
                <th>Leverantör</th>
                <th>Kategori</th>
                <th>Kostnad</th>
                <th>Frekvens</th>
                <th>Nästa Betalning</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${sortedAgreements.map(agreement => `
                <tr>
                  <td>${agreement.name || ''}</td>
                  <td>${agreement.provider || ''}</td>
                  <td>${agreement.category || ''}</td>
                  <td>${formatAmount(agreement.cost)}</td>
                  <td>${agreement.frequency || ''}</td>
                  <td>${agreement.next_payment || agreement.nextPayment || ''}</td>
                  <td>${agreement.status || ''}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    // Create blob and open in new window for printing
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, '_blank');
    
    if (printWindow) {
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 250);
      };
    }
    
    showToast('PDF-rapport öppnad för utskrift', { type: 'success' });
  };

  const handleImageClick = (e, agreement) => {
    e.stopPropagation(); // Förhindra att öppna drawer
    const images = parseImages(agreement.images);
    if (images && images.length > 0) {
      setLightboxImages(images);
      setLightboxIndex(0);
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
            {getTitle()}
          </h2>
        </div>
        <div className="flex gap-3">
          <div className="flex gap-2">
            <button 
              onClick={handleExport}
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
          <button 
            onClick={onAddAgreement}
            className={`flex items-center gap-2 ${getThemeButtonClass(colorTheme, 'primary')} px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-lg hover:shadow-xl active:scale-95`}
          >
            <Plus size={16} /> Lägg till Avtal
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Fast Månadskostnad" 
          amount={formatAmount(stats.totalMonthlyCost)} 
          change={`${formatAmount(stats.totalYearlyCost)}/år`}
          trend="up" 
          icon={<RefreshCw className="text-indigo-500 dark:text-indigo-400" />}
        />
        <StatCard 
          title="Aktiva Avtal" 
          amount={`${stats.activeCount} st`} 
          change={`${formatAmount(stats.totalYearlyCost)}/år`}
          trend="up" 
          icon={<FileText className="text-emerald-500 dark:text-emerald-400" />}
        />
        <StatCard 
          title="Total Årskostnad" 
          amount={formatAmount(stats.totalYearlyCost)} 
          change="Alla aktiva avtal"
          trend="up"
          icon={<AlertTriangle className="text-amber-500 dark:text-amber-400" />}
        />
      </div>

      {/* Cost per Category */}
      {Object.keys(stats.costByCategory).length > 0 && (
        <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/50 rounded-2xl p-6 shadow-sm dark:shadow-none">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Kostnad per Kategori</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(stats.costByCategory)
              .sort(([, a], [, b]) => b.yearly - a.yearly)
              .map(([category, costs]) => (
                <div key={category} className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700">
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-3">{category}</p>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-xl font-bold text-zinc-900 dark:text-white">{formatAmount(costs.yearly)}</p>
                      <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">per år</p>
                    </div>
                    <div className="flex-1 text-right">
                      <p className="text-xl font-bold text-zinc-900 dark:text-white">{formatAmount(costs.monthly)}</p>
                      <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">per månad</p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Yearly Overview and Trend */}
      <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/50 rounded-2xl p-6 shadow-sm dark:shadow-none">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Årsvis Översikt</h3>
        
        {/* Current Year */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {new Date().getFullYear()}
            </p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-white">
              {formatAmount(stats.totalYearlyCost)}
            </p>
          </div>
          
          {/* Simple trend visualization */}
          <div className="h-8 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden relative">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (stats.totalYearlyCost / 200000) * 100)}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-zinc-600 dark:text-zinc-400">
              {formatAmount(stats.totalYearlyCost)} / år
            </div>
          </div>
        </div>

        {/* Previous Year Comparison (mock data for now - would need historical data) */}
        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {new Date().getFullYear() - 1} (förra året)
            </p>
            <p className="text-lg font-semibold text-zinc-600 dark:text-zinc-400">
              {formatAmount(stats.totalYearlyCost * 0.95)} {/* Mock: 5% decrease */}
            </p>
          </div>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
            +{formatAmount(stats.totalYearlyCost * 0.05)} jämfört med förra året
          </p>
        </div>

        {/* Trend Chart - Monthly breakdown */}
        <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800">
          <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-4">Månadsvis Kostnad</h4>
          <div className="flex items-end gap-2 h-32">
            {Array.from({ length: 12 }, (_, i) => {
              const monthCost = stats.totalMonthlyCost;
              const maxCost = stats.totalMonthlyCost * 1.2; // Add some headroom
              const height = (monthCost / maxCost) * 100;
              const monthName = new Date(2024, i, 1).toLocaleDateString('sv-SE', { month: 'short' });
              
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-t relative" style={{ height: '100px' }}>
                    <div 
                      className="absolute bottom-0 w-full bg-gradient-to-t from-indigo-500 to-purple-600 rounded-t transition-all duration-500"
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{monthName}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/50 rounded-2xl flex flex-col shadow-sm dark:shadow-none overflow-hidden min-h-[600px]">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input 
                type="text" 
                placeholder="Sök namn, leverantör, kostnad, ID..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm w-full sm:w-64 focus:ring-2 focus:ring-indigo-500 outline-none" 
              />
            </div>
            <button 
              onClick={() => setIsFilterModalOpen(true)}
              className={`relative p-2 border rounded-lg transition-all ${
                Object.values(filters).some(v => v !== 'all' && v !== '')
                  ? `${getThemeBorderClass(colorTheme)} ${getThemeBgClass(colorTheme, isDarkMode)} ${getThemeTextClass(colorTheme, isDarkMode)}`
                  : 'border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-500'
              }`}
              title="Filtrera avtal"
            >
              <Filter size={18} />
              {Object.values(filters).some(v => v !== 'all' && v !== '') && (
                <span className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-zinc-900 ${
                  colorTheme === 'indigo' ? 'bg-indigo-600 dark:bg-indigo-500' :
                  colorTheme === 'blue' ? 'bg-blue-600 dark:bg-blue-500' :
                  colorTheme === 'emerald' ? 'bg-emerald-600 dark:bg-emerald-500' :
                  colorTheme === 'purple' ? 'bg-purple-600 dark:bg-purple-500' :
                  colorTheme === 'rose' ? 'bg-rose-600 dark:bg-rose-500' :
                  'bg-amber-600 dark:bg-amber-500'
                }`}></span>
              )}
            </button>
            {selectedAgreements.size > 0 && (
              <button 
                onClick={handleDeleteSelected}
                disabled={isDeleting}
                className="flex items-center gap-2 px-3 py-2 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg text-sm font-medium text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={`Radera ${selectedAgreements.size} valda avtal`}
              >
                {isDeleting ? (
                  <div className="w-4 h-4 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trash2 size={16} />
                )}
                Radera valda ({selectedAgreements.size})
              </button>
            )}
          </div>
          <div className="flex gap-2 w-full sm:w-auto items-center">
            {/* Kompakt översikt */}
            <div className="hidden md:flex items-center gap-3 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Månadskostnad:</span>
                <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">{formatAmount(filteredStats.totalMonthlyCost)}</span>
              </div>
              <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-700"></div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Årskostnad:</span>
                <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">{formatAmount(filteredStats.totalYearlyCost)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-zinc-50 dark:bg-zinc-800/30 border-b border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
          <div className="col-span-1 flex items-center justify-center">
            <input
              ref={selectAllCheckboxRef}
              type="checkbox"
              checked={selectedAgreements.size > 0 && selectedAgreements.size === sortedAgreements.length}
              onChange={(e) => handleSelectAll(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div 
            className="col-span-3 sm:col-span-2 flex items-center gap-1 cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-300 select-none"
            onClick={() => handleSort('provider')}
          >
            Tjänst / Leverantör
            {sortColumn === 'provider' && (
              sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
            )}
          </div>
          <div 
            className="col-span-2 hidden sm:flex items-center gap-1 cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-300 select-none"
            onClick={() => handleSort('category')}
          >
            Kategori
            {sortColumn === 'category' && (
              sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
            )}
          </div>
          <div 
            className="col-span-2 sm:col-span-2 flex items-center gap-1 cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-300 select-none"
            onClick={() => handleSort('cost')}
          >
            Kostnad
            {sortColumn === 'cost' && (
              sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
            )}
          </div>
          <div 
            className="col-span-2 hidden sm:flex items-center gap-1 cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-300 select-none"
            onClick={() => handleSort('nextPayment')}
          >
            Nästa Betalning
            {sortColumn === 'nextPayment' && (
              sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
            )}
          </div>
          <div className="col-span-1 text-center">Notering</div>
          <div className="col-span-1 text-center">Bild</div>
          <div className="col-span-2 sm:col-span-2 text-left">Status</div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="text-center py-12">Laddar avtal...</div>
          ) : sortedAgreements.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              {searchQuery ? `Inga avtal matchar "${searchQuery}"` : 'Inga avtal hittades'}
            </div>
          ) : (
            sortedAgreements.map(agreement => (
              <div 
                key={agreement.id} 
                onClick={() => setSelectedAgreement(agreement)}
                className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors items-center group cursor-pointer"
              >
                <div className="col-span-1 flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={selectedAgreements.has(agreement.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleToggleAgreement(agreement.id);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                </div>
                <div className="col-span-3 sm:col-span-2 flex items-center gap-3">
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
                  {agreement.category === 'Försäkring' && vehicles && vehicles.length > 0 && (() => {
                    const linkedVehicle = vehicles.find(v => v.agreement_id === agreement.id);
                    if (linkedVehicle) {
                      return (
                        <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1 font-medium">
                          🚗 {linkedVehicle.make_model} ({linkedVehicle.registration_number})
                        </p>
                      );
                    }
                    return null;
                  })()}
                </div>

                <div className="col-span-2 sm:col-span-2">
                  <p className="font-bold text-zinc-900 dark:text-white">{formatAmount(agreement.cost)}</p>
                  <p className="text-xs text-zinc-500">{agreement.frequency}</p>
                </div>

                <div className="col-span-2 hidden sm:block">
                  <div className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                    <CalendarClock size={14} className="text-indigo-500 dark:text-indigo-400" />
                    {(() => {
                      const nextPayment = agreement.next_payment || agreement.nextPayment;
                      if (!nextPayment) return 'Ingen datum';
                      
                      // Formatera datum om det är i ISO-format (YYYY-MM-DD)
                      if (nextPayment.match(/^\d{4}-\d{2}-\d{2}$/)) {
                        const date = new Date(nextPayment);
                        return date.toLocaleDateString('sv-SE', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        });
                      }
                      
                      return nextPayment;
                    })()}
                  </div>
                  {agreement.notice && (
                    <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">{agreement.notice}</p>
                  )}
                </div>

                {/* Notering-kolumn */}
                <div className="col-span-1 flex justify-center">
                  {(() => {
                    const hasNotice = agreement.notice && agreement.notice.trim().length > 0;
                    
                    return (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (setEditingNoteAgreementId) {
                            setEditingNoteAgreementId(agreement.id);
                          }
                        }}
                        className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                          hasNotice
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
                        title={hasNotice ? agreement.notice : "Lägg till notering"}
                      >
                        {hasNotice ? <Check size={14} /> : <Plus size={14} />}
                      </button>
                    );
                  })()}
                </div>

                {/* Bild-kolumn */}
                <div className="col-span-1 flex justify-center">
                  {(() => {
                    const images = parseImages(agreement.images);
                    const hasImages = images && images.length > 0;
                    
                    return (
                      <button
                        onClick={(e) => handleImageClick(e, agreement)}
                        className={`p-1.5 rounded-lg transition-all ${
                          hasImages
                            ? 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:scale-110 cursor-pointer'
                            : 'text-zinc-300 dark:text-zinc-700 cursor-default'
                        }`}
                        title={hasImages ? `${images.length} bild${images.length !== 1 ? 'er' : ''} - Klicka för att visa` : 'Inga bilder'}
                        disabled={!hasImages}
                      >
                        <CheckCircle2 size={18} className={hasImages ? 'fill-emerald-500 text-emerald-500' : ''} />
                      </button>
                    );
                  })()}
                </div>

                <div className="col-span-2 sm:col-span-2 flex justify-start items-center gap-2">
                  {agreement.start_date && agreement.end_date && (
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono whitespace-nowrap">
                      {agreement.start_date} → {agreement.end_date}
                    </span>
                  )}
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

      {/* Filter Modal */}
      <AgreementFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        categories={categories}
        filters={filters}
        onFiltersChange={setFilters}
      />

      {/* Image Lightbox */}
      {lightboxImages && lightboxImages.length > 0 && (
        <ImageLightbox
          images={lightboxImages}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxImages(null)}
        />
      )}
    </div>
  );
};

export default AgreementsTab;

