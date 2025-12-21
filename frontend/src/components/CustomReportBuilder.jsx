import React, { useState, useEffect } from 'react';
import { X, Plus, Save, Trash2, GripVertical, BarChart3, PieChart, TrendingUp, Table, FileText, Download, FileDown } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import { getThemeButtonClass, getThemeRingClass, getThemeTextClass } from '../utils/getThemeClasses';
import { api } from '../api';
import { BarChart, Bar, LineChart, Line, PieChart as RechartsPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const CustomReportBuilder = ({ isOpen, onClose, transactions = [], agreements = [], loans = [], dateRange, customStartDate, customEndDate }) => {
  const { colorTheme } = useTheme();
  const { showToast } = useToast();
  const [reportName, setReportName] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [components, setComponents] = useState([]);
  const [savedTemplates, setSavedTemplates] = useState([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen]);

  const loadTemplates = async () => {
    try {
      setIsLoadingTemplates(true);
      const templates = await api.getReportTemplates();
      setSavedTemplates(templates);
    } catch (error) {
      console.error('Kunde inte ladda mallar:', error);
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  const addComponent = (type) => {
    const newComponent = {
      id: Date.now().toString(),
      type,
      config: getDefaultConfig(type)
    };
    setComponents([...components, newComponent]);
  };

  const getDefaultConfig = (type) => {
    switch (type) {
      case 'kpi':
        return { label: 'KPI', metric: 'income' };
      case 'chart':
        return { chartType: 'bar', dataType: 'income-expense', title: 'Diagram' };
      case 'table':
        return { title: 'Tabell', showColumns: ['date', 'title', 'amount', 'category'] };
      case 'category-breakdown':
        return { title: 'Kategorifördelning', chartType: 'pie' };
      default:
        return {};
    }
  };

  const removeComponent = (id) => {
    setComponents(components.filter(c => c.id !== id));
  };

  const updateComponent = (id, config) => {
    setComponents(components.map(c => c.id === id ? { ...c, config } : c));
  };

  const handleSaveTemplate = async () => {
    if (!reportName.trim()) {
      showToast('Ange ett namn för rapporten', { type: 'error' });
      return;
    }

    try {
      await api.saveReportTemplate({
        name: reportName,
        categories: selectedCategories,
        components: components,
        dateRange: dateRange,
        customStartDate: customStartDate,
        customEndDate: customEndDate
      });
      showToast('Rapportmall sparad!', { type: 'success' });
      await loadTemplates();
    } catch (error) {
      console.error('Kunde inte spara mall:', error);
      showToast('Kunde inte spara rapportmall', { type: 'error' });
    }
  };

  const handleLoadTemplate = (template) => {
    setReportName(template.name);
    setSelectedCategories(template.categories || []);
    setComponents(template.components || []);
    setSelectedTemplate(template.id);
    showToast('Mall laddad!', { type: 'success' });
  };

  const handleDeleteTemplate = async (id) => {
    if (!confirm('Är du säker på att du vill radera denna mall?')) return;
    
    try {
      await api.deleteReportTemplate(id);
      showToast('Mall raderad!', { type: 'success' });
      await loadTemplates();
      if (selectedTemplate === id) {
        setReportName('');
        setSelectedCategories([]);
        setComponents([]);
        setSelectedTemplate(null);
      }
    } catch (error) {
      console.error('Kunde inte radera mall:', error);
      showToast('Kunde inte radera rapportmall', { type: 'error' });
    }
  };

  // Filter transactions based on selected categories and date range
  const filteredTransactions = transactions.filter(t => {
    if (selectedCategories.length > 0) {
      const categoryName = typeof t.category === 'string' ? t.category : t.category?.name || '';
      if (!selectedCategories.includes(categoryName)) return false;
    }
    return true;
  });

  // Prepare data for components
  const prepareComponentData = (component) => {
    switch (component.type) {
      case 'kpi':
        return calculateKPI(component.config.metric);
      case 'chart':
        return prepareChartData(component.config);
      case 'table':
        return { transactions: filteredTransactions };
      case 'category-breakdown':
        return prepareCategoryData();
      default:
        return {};
    }
  };

  const calculateKPI = (metric) => {
    let value = 0;
    filteredTransactions.forEach(t => {
      const amountStr = t.amount?.replace(/[^\d,.-]/g, '').replace(',', '') || '0';
      const amount = parseFloat(amountStr) || 0;
      
      if (metric === 'income' && t.type === 'income') {
        value += amount;
      } else if (metric === 'expenses' && t.type === 'expense') {
        value += Math.abs(amount);
      } else if (metric === 'netto') {
        value += t.type === 'income' ? amount : -Math.abs(amount);
      }
    });
    return { value };
  };

  const prepareChartData = (config) => {
    if (config.dataType === 'income-expense') {
      const monthlyData = {};
      filteredTransactions.forEach(t => {
        if (!t.date) return;
        const date = new Date(t.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthName = date.toLocaleDateString('sv-SE', { month: 'short', year: 'numeric' });
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { month: monthName, inkomst: 0, utgifter: 0 };
        }
        
        const amountStr = t.amount?.replace(/[^\d,.-]/g, '').replace(',', '') || '0';
        const amount = parseFloat(amountStr) || 0;
        
        if (t.type === 'income') {
          monthlyData[monthKey].inkomst += amount;
        } else if (t.type === 'expense') {
          monthlyData[monthKey].utgifter += Math.abs(amount);
        }
      });
      return { data: Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month)) };
    }
    return { data: [] };
  };

  const prepareCategoryData = () => {
    const categoryMap = {};
    filteredTransactions.forEach(t => {
      if (t.type === 'expense') {
        const categoryName = typeof t.category === 'string' ? t.category : t.category?.name || 'Övrigt';
        const amountStr = t.amount?.replace(/[^\d,.-]/g, '').replace(',', '') || '0';
        const amount = Math.abs(parseFloat(amountStr) || 0);
        categoryMap[categoryName] = (categoryMap[categoryName] || 0) + amount;
      }
    });
    return {
      data: Object.entries(categoryMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10)
    };
  };

  const renderComponent = (component) => {
    const data = prepareComponentData(component);
    
    switch (component.type) {
      case 'kpi':
        return <KPICard config={component.config} data={data} onUpdate={(config) => updateComponent(component.id, config)} />;
      case 'chart':
        return <ChartCard config={component.config} data={data} onUpdate={(config) => updateComponent(component.id, config)} colorTheme={colorTheme} />;
      case 'table':
        return <TableCard config={component.config} data={data} onUpdate={(config) => updateComponent(component.id, config)} />;
      case 'category-breakdown':
        return <CategoryBreakdownCard config={component.config} data={data} onUpdate={(config) => updateComponent(component.id, config)} colorTheme={colorTheme} />;
      default:
        return null;
    }
  };

  const handleExportPDF = async () => {
    if (components.length === 0) {
      showToast('Lägg till komponenter först', { type: 'error' });
      return;
    }

    // Convert logo to base64
    let logoBase64 = '';
    try {
      const logoResponse = await fetch('/logo.png');
      const logoBlob = await logoResponse.blob();
      const reader = new FileReader();
      logoBase64 = await new Promise((resolve) => {
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(logoBlob);
      });
    } catch (error) {
      console.warn('Kunde inte ladda logo:', error);
    }

    // Calculate exact date range
    const getCurrentPeriodDates = () => {
      const now = new Date();
      let startDate, endDate;
      
      switch (dateRange) {
        case 'month': {
          const currentYear = now.getFullYear();
          const currentMonth = now.getMonth();
          startDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`;
          const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
          endDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
          break;
        }
        case 'lastMonth': {
          const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const lastMonthYear = lastMonthDate.getFullYear();
          const lastMonthMonth = lastMonthDate.getMonth();
          startDate = `${lastMonthYear}-${String(lastMonthMonth + 1).padStart(2, '0')}-01`;
          const lastDay = new Date(lastMonthYear, lastMonthMonth + 1, 0).getDate();
          endDate = `${lastMonthYear}-${String(lastMonthMonth + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
          break;
        }
        case 'year': {
          const year = now.getFullYear();
          startDate = `${year}-01-01`;
          endDate = `${year}-12-31`;
          break;
        }
        case 'custom': {
          if (customStartDate && customEndDate) {
            startDate = customStartDate;
            endDate = customEndDate;
          } else {
            return null;
          }
          break;
        }
        default:
          return null;
      }
      
      return { startDate, endDate };
    };

    const currentDates = getCurrentPeriodDates();

    // Create HTML content for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>${reportName || 'Anpassad Rapport'} - WestBudget</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #18181b; }
            .header-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
            .logo { max-width: 120px; max-height: 60px; }
            .header-info { flex: 1; margin-left: 20px; }
            h1 { color: #18181b; margin-bottom: 10px; margin-top: 0; }
            h2 { color: #3f3f46; margin-top: 30px; margin-bottom: 15px; font-size: 18px; }
            .header { margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #e4e4e7; }
            .header p { color: #71717a; margin: 5px 0; }
            .component { margin: 30px 0; page-break-inside: avoid; }
            .kpi-card { background: #f4f4f5; padding: 20px; border-radius: 8px; margin: 15px 0; }
            .kpi-label { font-size: 12px; color: #71717a; margin-bottom: 5px; }
            .kpi-value { font-size: 24px; font-weight: bold; color: #18181b; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            th, td { border: 1px solid #e4e4e7; padding: 10px; text-align: left; font-size: 12px; }
            th { background-color: #f4f4f5; font-weight: bold; color: #18181b; }
            .chart-placeholder { background: #f4f4f5; padding: 40px; text-align: center; border-radius: 8px; color: #71717a; }
            .category-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e4e4e7; }
            .category-name { font-weight: 500; }
            .category-value { color: #18181b; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e4e4e7; text-align: center; color: #71717a; font-size: 11px; }
          </style>
        </head>
        <body>
          <div class="header-top">
            ${logoBase64 ? `<img src="${logoBase64}" alt="WestBudget Logo" class="logo" />` : ''}
            <div class="header-info">
              <h1>${reportName || 'Anpassad Rapport'}</h1>
              <p>Genererad: ${new Date().toLocaleDateString('sv-SE', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
          <div class="header">
            ${currentDates ? `<p><strong>Vald period:</strong> ${currentDates.startDate} till ${currentDates.endDate}</p>` : '<p><strong>Period:</strong> Alla transaktioner</p>'}
            ${selectedCategories.length > 0 ? `<p><strong>Kategorier:</strong> ${selectedCategories.join(', ')}</p>` : '<p><strong>Kategorier:</strong> Alla kategorier</p>'}
          </div>
          ${components.map((component, index) => {
            const data = prepareComponentData(component);
            switch (component.type) {
              case 'kpi':
                const kpiValue = data.value || 0;
                const kpiLabel = component.config.label || 'KPI';
                const metricLabel = component.config.metric === 'income' ? 'Inkomst' : component.config.metric === 'expenses' ? 'Utgifter' : 'Netto';
                return `
                  <div class="component">
                    <h2>${index + 1}. ${kpiLabel} - ${metricLabel}</h2>
                    <div class="kpi-card">
                      <div class="kpi-label">${metricLabel}</div>
                      <div class="kpi-value">${new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', minimumFractionDigits: 0 }).format(kpiValue)}</div>
                    </div>
                  </div>
                `;
              case 'chart':
                return `
                  <div class="component">
                    <h2>${index + 1}. ${component.config.title || 'Diagram'}</h2>
                    <div class="chart-placeholder">
                      <p>Diagram: ${component.config.chartType === 'bar' ? 'Stapel' : component.config.chartType === 'line' ? 'Linje' : 'Cirkel'}</p>
                      <p>Data: ${(data.data || []).length} datapunkter</p>
                      ${component.config.dataType === 'income-expense' && data.data && data.data.length > 0 ? `
                        <table>
                          <thead>
                            <tr>
                              <th>Månad</th>
                              <th>Inkomst</th>
                              <th>Utgifter</th>
                            </tr>
                          </thead>
                          <tbody>
                            ${data.data.map(item => `
                              <tr>
                                <td>${item.month}</td>
                                <td>${new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', minimumFractionDigits: 0 }).format(item.inkomst || 0)}</td>
                                <td>${new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', minimumFractionDigits: 0 }).format(item.utgifter || 0)}</td>
                              </tr>
                            `).join('')}
                          </tbody>
                        </table>
                      ` : ''}
                    </div>
                  </div>
                `;
              case 'table':
                return `
                  <div class="component">
                    <h2>${index + 1}. ${component.config.title || 'Tabell'}</h2>
                    <table>
                      <thead>
                        <tr>
                          <th>Datum</th>
                          <th>Titel</th>
                          <th>Belopp</th>
                          <th>Kategori</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${(data.transactions || []).slice(0, 50).map(t => `
                          <tr>
                            <td>${t.date || ''}</td>
                            <td>${t.title || ''}</td>
                            <td>${t.amount || ''}</td>
                            <td>${typeof t.category === 'string' ? t.category : t.category?.name || ''}</td>
                          </tr>
                        `).join('')}
                      </tbody>
                    </table>
                    ${(data.transactions || []).length > 50 ? `<p style="color: #71717a; font-size: 11px; margin-top: 10px;">Visar första 50 av ${data.transactions.length} transaktioner</p>` : ''}
                  </div>
                `;
              case 'category-breakdown':
                return `
                  <div class="component">
                    <h2>${index + 1}. ${component.config.title || 'Kategorifördelning'}</h2>
                    ${component.config.chartType === 'pie' ? `
                      <div class="chart-placeholder">
                        <p>Cirkeldiagram - Kategorifördelning</p>
                        <table>
                          <thead>
                            <tr>
                              <th>Kategori</th>
                              <th>Belopp</th>
                              <th>Procent</th>
                            </tr>
                          </thead>
                          <tbody>
                            ${(data.data || []).map(item => {
                              const total = (data.data || []).reduce((sum, i) => sum + (i.value || 0), 0);
                              const percent = total > 0 ? ((item.value || 0) / total * 100).toFixed(1) : 0;
                              return `
                                <tr>
                                  <td>${item.name}</td>
                                  <td>${new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', minimumFractionDigits: 0 }).format(item.value || 0)}</td>
                                  <td>${percent}%</td>
                                </tr>
                              `;
                            }).join('')}
                          </tbody>
                        </table>
                      </div>
                    ` : `
                      <div>
                        ${(data.data || []).map(item => `
                          <div class="category-item">
                            <span class="category-name">${item.name}</span>
                            <span class="category-value">${new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', minimumFractionDigits: 0 }).format(item.value || 0)}</span>
                          </div>
                        `).join('')}
                      </div>
                    `}
                  </div>
                `;
              default:
                return '';
            }
          }).join('')}
          <div class="footer">
            <p>WestBudget - Ekonomi & Budget</p>
            <p>Rapport genererad ${new Date().toLocaleString('sv-SE')}</p>
          </div>
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
        }, 500);
      };
    } else {
      showToast('Kunde inte öppna PDF-fönster. Kontrollera popup-blockerare.', { type: 'error' });
      return;
    }
    
    showToast('PDF-rapport öppnad för utskrift', { type: 'success' });
  };

  const handleExportCSV = () => {
    if (components.length === 0) {
      showToast('Lägg till komponenter först', { type: 'error' });
      return;
    }

    // Calculate exact date range
    const getCurrentPeriodDates = () => {
      const now = new Date();
      let startDate, endDate;
      
      switch (dateRange) {
        case 'month': {
          const currentYear = now.getFullYear();
          const currentMonth = now.getMonth();
          startDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`;
          const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
          endDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
          break;
        }
        case 'lastMonth': {
          const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const lastMonthYear = lastMonthDate.getFullYear();
          const lastMonthMonth = lastMonthDate.getMonth();
          startDate = `${lastMonthYear}-${String(lastMonthMonth + 1).padStart(2, '0')}-01`;
          const lastDay = new Date(lastMonthYear, lastMonthMonth + 1, 0).getDate();
          endDate = `${lastMonthYear}-${String(lastMonthMonth + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
          break;
        }
        case 'year': {
          const year = now.getFullYear();
          startDate = `${year}-01-01`;
          endDate = `${year}-12-31`;
          break;
        }
        case 'custom': {
          if (customStartDate && customEndDate) {
            startDate = customStartDate;
            endDate = customEndDate;
          } else {
            return null;
          }
          break;
        }
        default:
          return null;
      }
      
      return { startDate, endDate };
    };

    const currentDates = getCurrentPeriodDates();

    // Collect all data from components
    let csvContent = `"${reportName || 'Anpassad Rapport'} - WestBudget"\n`;
    csvContent += `"Genererad: ${new Date().toLocaleString('sv-SE')}"\n`;
    if (currentDates) {
      csvContent += `"Aktuell period: ${currentDates.startDate} till ${currentDates.endDate}"\n`;
    } else {
      csvContent += `"Period: Alla transaktioner"\n`;
    }
    csvContent += `"Kategorier: ${selectedCategories.length > 0 ? selectedCategories.join(', ') : 'Alla'}"\n\n`;

    components.forEach((component, index) => {
      const data = prepareComponentData(component);
      csvContent += `"${index + 1}. ${component.type === 'kpi' ? 'KPI' : component.type === 'chart' ? 'Diagram' : component.type === 'table' ? 'Tabell' : 'Kategorifördelning'}"\n`;

      switch (component.type) {
        case 'kpi':
          const metricLabel = component.config.metric === 'income' ? 'Inkomst' : component.config.metric === 'expenses' ? 'Utgifter' : 'Netto';
          csvContent += `"${metricLabel}","${data.value || 0}"\n`;
          break;
        case 'chart':
          if (component.config.dataType === 'income-expense' && data.data && data.data.length > 0) {
            csvContent += '"Månad","Inkomst","Utgifter"\n';
            data.data.forEach(item => {
              csvContent += `"${item.month}","${item.inkomst || 0}","${item.utgifter || 0}"\n`;
            });
          }
          break;
        case 'table':
          csvContent += '"Datum","Titel","Belopp","Kategori"\n';
          (data.transactions || []).forEach(t => {
            const categoryName = typeof t.category === 'string' ? t.category : t.category?.name || '';
            csvContent += `"${t.date || ''}","${(t.title || '').replace(/"/g, '""')}","${t.amount || ''}","${categoryName}"\n`;
          });
          break;
        case 'category-breakdown':
          csvContent += '"Kategori","Belopp"\n';
          (data.data || []).forEach(item => {
            csvContent += `"${item.name}","${item.value || 0}"\n`;
          });
          break;
      }
      csvContent += '\n';
    });

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${reportName || 'rapport'}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('CSV-fil nedladdad!', { type: 'success' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-6xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
              Skapa Anpassad Rapport
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Bygg din egen rapport med valbara komponenter
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
            <X size={20} className="text-zinc-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0">
          {/* Report Name */}
          <div>
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2 block">
              Rapportnamn
            </label>
            <input
              type="text"
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
              placeholder="t.ex. Månadsrapport 2024"
              className={`w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:ring-2 ${getThemeRingClass(colorTheme)} outline-none`}
            />
          </div>

          {/* Category Selection */}
          <div>
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2 block">
              Välj Kategorier (lämna tomt för alla)
            </label>
            <div className="max-h-40 overflow-y-auto border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 space-y-1">
              {Array.from(new Set(transactions.map(t => typeof t.category === 'string' ? t.category : t.category?.name || 'Övrigt'))).map(category => (
                <label key={category} className="flex items-center gap-2 p-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(category)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCategories([...selectedCategories, category]);
                      } else {
                        setSelectedCategories(selectedCategories.filter(c => c !== category));
                      }
                    }}
                    className={`rounded border-zinc-300 dark:border-zinc-600 ${getThemeTextClass(colorTheme, false)} ${getThemeRingClass(colorTheme)}`}
                  />
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">{category}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Add Components */}
          <div>
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2 block">
              Lägg till Komponenter
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <button
                onClick={() => addComponent('kpi')}
                className={`p-3 border-2 border-zinc-200 dark:border-zinc-700 rounded-lg hover:border-indigo-500 dark:hover:border-indigo-500 transition-all text-center`}
              >
                <TrendingUp size={20} className="mx-auto mb-1 text-zinc-500" />
                <span className="text-xs text-zinc-700 dark:text-zinc-300">KPI</span>
              </button>
              <button
                onClick={() => addComponent('chart')}
                className={`p-3 border-2 border-zinc-200 dark:border-zinc-700 rounded-lg hover:border-indigo-500 dark:hover:border-indigo-500 transition-all text-center`}
              >
                <BarChart3 size={20} className="mx-auto mb-1 text-zinc-500" />
                <span className="text-xs text-zinc-700 dark:text-zinc-300">Diagram</span>
              </button>
              <button
                onClick={() => addComponent('table')}
                className={`p-3 border-2 border-zinc-200 dark:border-zinc-700 rounded-lg hover:border-indigo-500 dark:hover:border-indigo-500 transition-all text-center`}
              >
                <Table size={20} className="mx-auto mb-1 text-zinc-500" />
                <span className="text-xs text-zinc-700 dark:text-zinc-300">Tabell</span>
              </button>
              <button
                onClick={() => addComponent('category-breakdown')}
                className={`p-3 border-2 border-zinc-200 dark:border-zinc-700 rounded-lg hover:border-indigo-500 dark:hover:border-indigo-500 transition-all text-center`}
              >
                <PieChart size={20} className="mx-auto mb-1 text-zinc-500" />
                <span className="text-xs text-zinc-700 dark:text-zinc-300">Kategorier</span>
              </button>
            </div>
          </div>

          {/* Components List */}
          <div className="space-y-4">
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2 block">
              Rapportkomponenter ({components.length})
            </label>
            {components.length === 0 ? (
              <div className="text-center py-8 text-zinc-500 dark:text-zinc-400 border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-lg">
                <FileText size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">Inga komponenter ännu. Lägg till komponenter ovan.</p>
              </div>
            ) : (
              components.map((component, index) => (
                <div key={component.id} className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-4 bg-zinc-50 dark:bg-zinc-800/50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <GripVertical size={16} className="text-zinc-400" />
                      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        {index + 1}. {component.type === 'kpi' ? 'KPI' : component.type === 'chart' ? 'Diagram' : component.type === 'table' ? 'Tabell' : 'Kategorifördelning'}
                      </span>
                    </div>
                    <button
                      onClick={() => removeComponent(component.id)}
                      className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition-colors"
                    >
                      <Trash2 size={16} className="text-rose-500" />
                    </button>
                  </div>
                  {renderComponent(component)}
                </div>
              ))
            )}
          </div>

          {/* Saved Templates */}
          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2 block">
              Sparade Mallar
            </label>
            {isLoadingTemplates ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Laddar mallar...</p>
            ) : savedTemplates.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Inga sparade mallar ännu</p>
            ) : (
              <div className="space-y-2">
                {savedTemplates.map(template => (
                  <div key={template.id} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700">
                    <div>
                      <p className="text-sm font-medium text-zinc-900 dark:text-white">{template.name}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {template.components?.length || 0} komponenter
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleLoadTemplate(template)}
                        className={`px-3 py-1 text-sm ${getThemeButtonClass(colorTheme, 'primary')} rounded-lg`}
                      >
                        Ladda
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="px-3 py-1 text-sm bg-rose-600 hover:bg-rose-700 text-white rounded-lg"
                      >
                        Radera
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center flex-shrink-0">
          <div className="flex gap-2">
            <button
              onClick={handleExportPDF}
              disabled={components.length === 0}
              className={`px-4 py-2 ${getThemeButtonClass(colorTheme, 'secondary')} rounded-lg transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Download size={16} />
              Exportera PDF
            </button>
            <button
              onClick={handleExportCSV}
              disabled={components.length === 0}
              className={`px-4 py-2 ${getThemeButtonClass(colorTheme, 'secondary')} rounded-lg transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <FileDown size={16} />
              Exportera CSV
            </button>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-sm font-medium"
            >
              Avbryt
            </button>
            <button
              onClick={handleSaveTemplate}
              disabled={!reportName.trim() || components.length === 0}
              className={`px-6 py-2 ${getThemeButtonClass(colorTheme, 'primary')} rounded-lg transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Save size={16} />
              Spara Mall
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Sub-components for rendering different component types
const KPICard = ({ config, data, onUpdate }) => {
  return (
    <div className="space-y-2">
      <select
        value={config.metric || 'income'}
        onChange={(e) => onUpdate({ ...config, metric: e.target.value })}
        className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm"
      >
        <option value="income">Inkomst</option>
        <option value="expenses">Utgifter</option>
        <option value="netto">Netto</option>
      </select>
      <div className="p-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700">
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">{config.label || 'KPI'}</p>
        <p className="text-2xl font-bold text-zinc-900 dark:text-white">
          {new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', minimumFractionDigits: 0 }).format(data.value || 0)}
        </p>
      </div>
    </div>
  );
};

const ChartCard = ({ config, data, onUpdate, colorTheme }) => {
  const isDark = document.documentElement.classList.contains('dark');
  const themeColors = {
    indigo: { primary: '#6366f1', secondary: '#818cf8' },
    blue: { primary: '#3b82f6', secondary: '#60a5fa' },
    emerald: { primary: '#10b981', secondary: '#34d399' },
    purple: { primary: '#a855f7', secondary: '#c084fc' },
    rose: { primary: '#f43f5e', secondary: '#fb7185' },
    amber: { primary: '#f59e0b', secondary: '#fbbf24' }
  };
  const colors = themeColors[colorTheme] || themeColors.indigo;

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <select
          value={config.chartType || 'bar'}
          onChange={(e) => onUpdate({ ...config, chartType: e.target.value })}
          className="flex-1 px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm"
        >
          <option value="bar">Stapel</option>
          <option value="line">Linje</option>
          <option value="pie">Cirkel</option>
        </select>
        <input
          type="text"
          value={config.title || ''}
          onChange={(e) => onUpdate({ ...config, title: e.target.value })}
          placeholder="Titel"
          className="flex-1 px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm"
        />
      </div>
      <div className="p-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700">
        {config.chartType === 'pie' ? (
          <ResponsiveContainer width="100%" height={200}>
            <RechartsPieChart>
              <Pie
                data={data.data || []}
                cx="50%"
                cy="50%"
                outerRadius={60}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {(data.data || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={[colors.primary, colors.secondary, '#8b5cf6', '#ec4899'][index % 4]} />
                ))}
              </Pie>
              <Tooltip />
            </RechartsPieChart>
          </ResponsiveContainer>
        ) : config.chartType === 'line' ? (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data.data || []}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#3f3f46' : '#e4e4e7'} />
              <XAxis dataKey="month" stroke={isDark ? '#a1a1aa' : '#71717a'} style={{ fontSize: '12px' }} />
              <YAxis stroke={isDark ? '#a1a1aa' : '#71717a'} style={{ fontSize: '12px' }} />
              <Tooltip />
              <Line type="monotone" dataKey="inkomst" stroke={colors.primary} strokeWidth={2} name="Inkomst" />
              <Line type="monotone" dataKey="utgifter" stroke={colors.secondary} strokeWidth={2} name="Utgifter" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.data || []}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#3f3f46' : '#e4e4e7'} />
              <XAxis dataKey="month" stroke={isDark ? '#a1a1aa' : '#71717a'} style={{ fontSize: '12px' }} />
              <YAxis stroke={isDark ? '#a1a1aa' : '#71717a'} style={{ fontSize: '12px' }} />
              <Tooltip />
              <Bar dataKey="inkomst" fill={colors.primary} name="Inkomst" />
              <Bar dataKey="utgifter" fill={colors.secondary} name="Utgifter" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

const TableCard = ({ config, data, onUpdate }) => {
  return (
    <div className="space-y-2">
      <input
        type="text"
        value={config.title || ''}
        onChange={(e) => onUpdate({ ...config, title: e.target.value })}
        placeholder="Titel"
        className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm"
      />
      <div className="p-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 max-h-60 overflow-y-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-700">
              <th className="text-left py-2 text-zinc-700 dark:text-zinc-300">Datum</th>
              <th className="text-left py-2 text-zinc-700 dark:text-zinc-300">Titel</th>
              <th className="text-right py-2 text-zinc-700 dark:text-zinc-300">Belopp</th>
              <th className="text-left py-2 text-zinc-700 dark:text-zinc-300">Kategori</th>
            </tr>
          </thead>
          <tbody>
            {(data.transactions || []).slice(0, 10).map(t => (
              <tr key={t.id} className="border-b border-zinc-100 dark:border-zinc-800">
                <td className="py-2 text-zinc-600 dark:text-zinc-400">{t.date}</td>
                <td className="py-2 text-zinc-900 dark:text-white">{t.title}</td>
                <td className="py-2 text-right text-zinc-900 dark:text-white">{t.amount}</td>
                <td className="py-2 text-zinc-600 dark:text-zinc-400">{typeof t.category === 'string' ? t.category : t.category?.name || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const CategoryBreakdownCard = ({ config, data, onUpdate, colorTheme }) => {
  const isDark = document.documentElement.classList.contains('dark');
  const themeColors = {
    indigo: { primary: '#6366f1', secondary: '#818cf8' },
    blue: { primary: '#3b82f6', secondary: '#60a5fa' },
    emerald: { primary: '#10b981', secondary: '#34d399' },
    purple: { primary: '#a855f7', secondary: '#c084fc' },
    rose: { primary: '#f43f5e', secondary: '#fb7185' },
    amber: { primary: '#f59e0b', secondary: '#fbbf24' }
  };
  const colors = themeColors[colorTheme] || themeColors.indigo;
  const COLORS = [colors.primary, colors.secondary, '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b'];

  return (
    <div className="space-y-2">
      <input
        type="text"
        value={config.title || ''}
        onChange={(e) => onUpdate({ ...config, title: e.target.value })}
        placeholder="Titel"
        className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm"
      />
      <div className="p-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700">
        {config.chartType === 'pie' ? (
          <ResponsiveContainer width="100%" height={200}>
            <RechartsPieChart>
              <Pie
                data={data.data || []}
                cx="50%"
                cy="50%"
                outerRadius={60}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {(data.data || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </RechartsPieChart>
          </ResponsiveContainer>
        ) : (
          <div className="space-y-2">
            {(data.data || []).map((item, index) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">{item.name}</span>
                </div>
                <span className="text-sm font-medium text-zinc-900 dark:text-white">
                  {new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', minimumFractionDigits: 0 }).format(item.value || 0)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomReportBuilder;

