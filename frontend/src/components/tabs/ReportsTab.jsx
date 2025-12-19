import React, { useMemo, useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Download, Calendar, DollarSign, PiggyBank, BarChart3, PieChart, CheckSquare, Square, Settings2 } from 'lucide-react';
import DateRangeBtn from '../DateRangeBtn';
import StatCard from '../StatCard';
import { filterByDateRange } from '../../utils/filterByDateRange';
import { formatAmount, getAmountClassName } from '../../utils/formatAmount';
import { useToast } from '../../contexts/ToastContext';

const ReportsTab = ({ 
  transactions = [], 
  agreements = [],
  loans = [],
  dateRange, 
  setDateRange,
  customStartDate,
  customEndDate,
  setIsCustomDateModalOpen,
  getTitle, 
  loading 
}) => {
  const { showToast } = useToast();
  const [compareMode, setCompareMode] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState(new Set());
  const [includeLoans, setIncludeLoans] = useState(false);
  const [showCategorySelector, setShowCategorySelector] = useState(false);

  // Hämta start- och slutdatum för aktuell period
  const getCurrentPeriodDates = useMemo(() => {
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
  }, [dateRange, customStartDate, customEndDate]);

  // Filtrera transaktioner för aktuell period
  const currentPeriodTransactions = useMemo(() => {
    return filterByDateRange(transactions, dateRange, customStartDate, customEndDate);
  }, [transactions, dateRange, customStartDate, customEndDate]);

  // Filtrera transaktioner för föregående period (för jämförelse)
  const previousPeriodTransactions = useMemo(() => {
    if (!compareMode) return [];
    
    const now = new Date();
    let prevStartDate, prevEndDate;
    
    switch (dateRange) {
      case 'month': {
        // Föregående månad
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthYear = lastMonth.getFullYear();
        const lastMonthMonth = lastMonth.getMonth();
        prevStartDate = `${lastMonthYear}-${String(lastMonthMonth + 1).padStart(2, '0')}-01`;
        const lastDay = new Date(lastMonthYear, lastMonthMonth + 1, 0).getDate();
        prevEndDate = `${lastMonthYear}-${String(lastMonthMonth + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
        break;
      }
      case 'lastMonth': {
        // Månaden innan föregående månad
        const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        const year = twoMonthsAgo.getFullYear();
        const month = twoMonthsAgo.getMonth();
        prevStartDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
        const lastDay = new Date(year, month + 1, 0).getDate();
        prevEndDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
        break;
      }
      case 'year': {
        // Föregående år
        const lastYear = now.getFullYear() - 1;
        prevStartDate = `${lastYear}-01-01`;
        prevEndDate = `${lastYear}-12-31`;
        break;
      }
      case 'custom': {
        if (customStartDate && customEndDate) {
          // Beräkna samma längd bakåt i tiden
          const start = new Date(customStartDate);
          const end = new Date(customEndDate);
          const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
          const prevEnd = new Date(start);
          prevEnd.setDate(prevEnd.getDate() - 1);
          const prevStart = new Date(prevEnd);
          prevStart.setDate(prevStart.getDate() - daysDiff);
          prevStartDate = prevStart.toISOString().split('T')[0];
          prevEndDate = prevEnd.toISOString().split('T')[0];
        } else {
          return [];
        }
        break;
      }
      default:
        return [];
    }
    
    return filterByDateRange(transactions, 'custom', prevStartDate, prevEndDate);
  }, [transactions, dateRange, customStartDate, customEndDate, compareMode]);

  // Hjälpfunktion för att beräkna antal månader i perioden (måste definieras före currentStats)
  const getPeriodMonths = useMemo(() => {
    if (!getCurrentPeriodDates) return 1;
    const { startDate, endDate } = getCurrentPeriodDates;
    if (!startDate || !endDate) return 1;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
    return Math.max(1, months);
  }, [getCurrentPeriodDates]);

  // Beräkna statistik för aktuell period
  const currentStats = useMemo(() => {
    let income = 0;
    let expenses = 0;
    let transactionCount = currentPeriodTransactions.length;

    currentPeriodTransactions.forEach(t => {
      const amountStr = t.amount?.replace(/[^\d,.-]/g, '').replace(',', '') || '0';
      const amount = parseFloat(amountStr) || 0;

      if (t.type === 'income') {
        income += amount;
      } else if (t.type === 'expense') {
        expenses += Math.abs(amount);
      }
    });

    // Lägg till lånens månadsbetalningar om includeLoans är aktiverat
    if (includeLoans && loans && loans.length > 0) {
      const activeLoans = loans.filter(l => l.status === 'Aktiv');
      const periodMonths = getPeriodMonths;
      activeLoans.forEach(loan => {
        const monthlyPayment = parseFloat(loan.monthly_payment) || 0;
        const totalPayment = monthlyPayment * periodMonths;
        expenses += totalPayment;
      });
    }

    const netto = income - expenses;
    const avgIncome = transactionCount > 0 ? income / transactionCount : 0;
    const avgExpense = transactionCount > 0 ? expenses / transactionCount : 0;

    return {
      income,
      expenses,
      netto,
      avgIncome,
      avgExpense,
      transactionCount
    };
  }, [currentPeriodTransactions, includeLoans, loans, getPeriodMonths]);

  // Beräkna statistik för föregående period
  const previousStats = useMemo(() => {
    if (!compareMode || previousPeriodTransactions.length === 0) {
      return null;
    }

    let income = 0;
    let expenses = 0;

    previousPeriodTransactions.forEach(t => {
      const amountStr = t.amount?.replace(/[^\d,.-]/g, '').replace(',', '') || '0';
      const amount = parseFloat(amountStr) || 0;

      if (t.type === 'income') {
        income += amount;
      } else if (t.type === 'expense') {
        expenses += Math.abs(amount);
      }
    });

    const netto = income - expenses;

    return { income, expenses, netto };
  }, [previousPeriodTransactions, compareMode]);

  // Beräkna trend (jämförelse med föregående period)
  const getTrend = (current, previous) => {
    if (!previous || previous === 0) return null;
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(change).toFixed(1),
      direction: change >= 0 ? 'up' : 'down'
    };
  };

  // Månadsvis breakdown för diagram
  const monthlyBreakdown = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];
    const breakdown = months.map(() => ({ income: 0, expenses: 0 }));

    currentPeriodTransactions.forEach(t => {
      if (!t.date) return;
      
      // Parse date - handle different formats
      let date;
      if (typeof t.date === 'string') {
        // Remove time portion if present
        const dateStr = t.date.split('T')[0].split(' ')[0];
        date = new Date(dateStr);
      } else {
        date = new Date(t.date);
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn('Invalid date:', t.date);
        return;
      }
      
      const month = date.getMonth();
      
      // Validate month index
      if (month < 0 || month > 11) {
        console.warn('Invalid month:', month, 'from date:', t.date);
        return;
      }
      
      const amountStr = t.amount?.replace(/[^\d,.-]/g, '').replace(',', '') || '0';
      const amount = parseFloat(amountStr) || 0;

      if (t.type === 'income') {
        breakdown[month].income += amount;
      } else if (t.type === 'expense') {
        breakdown[month].expenses += Math.abs(amount);
      }
    });

    // Lägg till lånens månadsbetalningar om includeLoans är aktiverat
    if (includeLoans && loans && loans.length > 0) {
      const activeLoans = loans.filter(l => l.status === 'Aktiv');
      const periodDates = getCurrentPeriodDates;
      
      if (periodDates && periodDates.startDate && periodDates.endDate) {
        const start = new Date(periodDates.startDate);
        const end = new Date(periodDates.endDate);
        
        // För varje månad i perioden, lägg till månadsbetalningar
        const current = new Date(start);
        while (current <= end) {
          const month = current.getMonth();
          if (month >= 0 && month <= 11) {
            activeLoans.forEach(loan => {
              const monthlyPayment = parseFloat(loan.monthly_payment) || 0;
              breakdown[month].expenses += monthlyPayment;
            });
          }
          // Gå till nästa månad
          current.setMonth(current.getMonth() + 1);
        }
      }
    }

    // Hitta max-värde för normalisering
    const maxValue = Math.max(
      ...breakdown.map(m => Math.max(m.income, m.expenses)),
      1
    );

    return breakdown.map(m => ({
      ...m,
      incomePercent: maxValue > 0 ? (m.income / maxValue) * 100 : 0,
      expensesPercent: maxValue > 0 ? (m.expenses / maxValue) * 100 : 0
    }));
  }, [currentPeriodTransactions, includeLoans, loans, getCurrentPeriodDates]);

  // Hämta alla unika kategorier från utgifter
  const allCategories = useMemo(() => {
    const categorySet = new Set();
    currentPeriodTransactions.forEach(t => {
      if (t.type === 'expense') {
        const categoryName = typeof t.category === 'string' ? t.category : t.category?.name || 'Övrigt';
        categorySet.add(categoryName);
      }
    });
    return Array.from(categorySet).sort();
  }, [currentPeriodTransactions]);

  // Initiera selectedCategories med alla kategorier om det är tomt
  useEffect(() => {
    if (selectedCategories.size === 0 && allCategories.length > 0) {
      setSelectedCategories(new Set(allCategories));
    }
  }, [allCategories, selectedCategories.size]);

  // Kategorifördelning (filtrerad baserat på valda kategorier)
  const categoryBreakdown = useMemo(() => {
    const categoryMap = {};
    
    currentPeriodTransactions.forEach(t => {
      if (t.type !== 'expense') return;
      
      const categoryName = typeof t.category === 'string' ? t.category : t.category?.name || 'Övrigt';
      
      // Filtrera baserat på valda kategorier
      if (selectedCategories.size > 0 && !selectedCategories.has(categoryName)) {
        return;
      }
      
      const amountStr = t.amount?.replace(/[^\d,.-]/g, '').replace(',', '') || '0';
      const amount = parseFloat(amountStr) || 0;

      if (!categoryMap[categoryName]) {
        categoryMap[categoryName] = 0;
      }
      categoryMap[categoryName] += Math.abs(amount);
    });

    // Lägg till lån om includeLoans är aktiverat
    if (includeLoans && loans && loans.length > 0) {
      const activeLoans = loans.filter(l => l.status === 'Aktiv');
      activeLoans.forEach(loan => {
        const categoryName = loan.category || 'Lån';
        const monthlyPayment = parseFloat(loan.monthly_payment) || 0;
        
        // Beräkna månadsbetalning för perioden
        const totalPayment = monthlyPayment * getPeriodMonths;
        
        if (!categoryMap[categoryName]) {
          categoryMap[categoryName] = 0;
        }
        categoryMap[categoryName] += totalPayment;
      });
    }

    const total = Object.values(categoryMap).reduce((sum, val) => sum + val, 0);
    
    return Object.entries(categoryMap)
      .map(([name, amount]) => ({
        name,
        amount,
        percent: total > 0 ? (amount / total) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [currentPeriodTransactions, selectedCategories, includeLoans, loans, getPeriodMonths]);

  // PDF Export
  const handleExportPDF = async () => {
    if (currentPeriodTransactions.length === 0) {
      showToast('Inga transaktioner att exportera', { type: 'info' });
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

    // Get date range string for title (with actual dates)
    const getDateRangeString = () => {
      if (getCurrentPeriodDates) {
        return `${getCurrentPeriodDates.startDate} till ${getCurrentPeriodDates.endDate}`;
      }
      return 'Alla Transaktioner';
    };

    // Create HTML content for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>WestBudget Rapport</title>
          <style>
            @media print {
              @page { margin: 1.5cm; }
              body { margin: 0; }
            }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; 
              padding: 20px; 
              color: #1f2937;
              line-height: 1.6;
            }
            .header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 2px solid #e5e7eb;
            }
            .logo {
              height: 60px;
              width: auto;
            }
            .header-text {
              text-align: right;
            }
            h1 { 
              color: #111827; 
              margin: 0 0 5px 0;
              font-size: 28px;
            }
            .subtitle {
              color: #6b7280;
              font-size: 14px;
              margin: 0;
            }
            .period {
              color: #4b5563;
              font-size: 16px;
              margin: 10px 0;
            }
            .kpi-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 15px;
              margin: 25px 0;
            }
            .kpi-card {
              background: #f9fafb;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              padding: 15px;
              text-align: center;
            }
            .kpi-label {
              font-size: 12px;
              color: #6b7280;
              margin-bottom: 8px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .kpi-value {
              font-size: 24px;
              font-weight: bold;
              color: #111827;
            }
            .kpi-value.positive { color: #10b981; }
            .kpi-value.negative { color: #ef4444; }
            .section {
              margin: 30px 0;
              page-break-inside: avoid;
            }
            .section-title {
              font-size: 20px;
              font-weight: 600;
              color: #111827;
              margin-bottom: 15px;
              padding-bottom: 10px;
              border-bottom: 1px solid #e5e7eb;
            }
            .stats-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 20px;
              margin: 20px 0;
            }
            .stat-box {
              background: #f9fafb;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              padding: 15px;
            }
            .stat-row {
              display: flex;
              justify-content: space-between;
              padding: 10px 0;
              border-bottom: 1px dashed #e5e7eb;
            }
            .stat-row:last-child {
              border-bottom: none;
              font-weight: 600;
              font-size: 18px;
              margin-top: 10px;
              padding-top: 15px;
            }
            .stat-label {
              color: #6b7280;
            }
            .stat-value {
              font-weight: 600;
              color: #111827;
            }
            .category-list {
              list-style: none;
              padding: 0;
              margin: 0;
            }
            .category-item {
              display: flex;
              justify-content: space-between;
              padding: 12px;
              border-bottom: 1px solid #e5e7eb;
            }
            .category-item:last-child {
              border-bottom: none;
            }
            .category-name {
              display: flex;
              align-items: center;
              gap: 10px;
            }
            .category-dot {
              width: 12px;
              height: 12px;
              border-radius: 50%;
            }
            .category-info {
              display: flex;
              gap: 15px;
              align-items: center;
            }
            .category-percent {
              color: #9ca3af;
              font-size: 14px;
            }
            .category-amount {
              font-weight: 600;
              min-width: 100px;
              text-align: right;
            }
            .monthly-chart {
              margin: 20px 0;
              padding: 20px;
              background: #f9fafb;
              border-radius: 8px;
            }
            .chart-bars {
              display: flex;
              align-items: flex-end;
              justify-content: space-between;
              height: 200px;
              gap: 5px;
              margin: 20px 0;
            }
            .chart-bar-group {
              flex: 1;
              display: flex;
              gap: 2px;
              align-items: flex-end;
              height: 100%;
            }
            .chart-bar {
              flex: 1;
              border-radius: 4px 4px 0 0;
            }
            .chart-bar.income {
              background: #10b981;
            }
            .chart-bar.expense {
              background: #ef4444;
            }
            .chart-labels {
              display: flex;
              justify-content: space-between;
              margin-top: 10px;
              font-size: 11px;
              color: #6b7280;
              text-transform: uppercase;
            }
            .comparison {
              background: #eff6ff;
              border: 1px solid #bfdbfe;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
            }
            .comparison-title {
              font-weight: 600;
              margin-bottom: 15px;
              color: #1e40af;
            }
            .comparison-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 15px;
            }
            .comparison-item {
              text-align: center;
            }
            .comparison-label {
              font-size: 12px;
              color: #6b7280;
              margin-bottom: 5px;
            }
            .comparison-current {
              font-size: 20px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .comparison-previous {
              font-size: 12px;
              color: #9ca3af;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              text-align: center;
              color: #9ca3af;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            ${logoBase64 ? `<img src="${logoBase64}" alt="WestBudget" class="logo" />` : '<div></div>'}
            <div class="header-text">
              <h1>Ekonomisk Rapport</h1>
              <p class="subtitle">WestBudget</p>
            </div>
          </div>
          
          <p class="period"><strong>Period:</strong> ${getDateRangeString()}</p>
          <p class="subtitle">Genererad: ${new Date().toLocaleDateString('sv-SE', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>

          <!-- KPI Cards -->
          <div class="kpi-grid">
            <div class="kpi-card">
              <div class="kpi-label">Genomsnittlig Inkomst</div>
              <div class="kpi-value positive">${formatAmount(currentStats.avgIncome)}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">Genomsnittlig Utgift</div>
              <div class="kpi-value negative">${formatAmount(currentStats.avgExpense)}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">Sparande</div>
              <div class="kpi-value ${currentStats.netto >= 0 ? 'positive' : 'negative'}">${formatAmount(currentStats.netto)}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">Antal Transaktioner</div>
              <div class="kpi-value">${currentStats.transactionCount}</div>
            </div>
          </div>

          ${compareMode && previousStats ? `
          <div class="comparison">
            <div class="comparison-title">Jämförelse med Föregående Period</div>
            <div class="comparison-grid">
              <div class="comparison-item">
                <div class="comparison-label">Inkomst</div>
                <div class="comparison-current positive">${formatAmount(currentStats.income)}</div>
                <div class="comparison-previous">Föregående: ${formatAmount(previousStats.income)}</div>
              </div>
              <div class="comparison-item">
                <div class="comparison-label">Utgifter</div>
                <div class="comparison-current negative">${formatAmount(currentStats.expenses)}</div>
                <div class="comparison-previous">Föregående: ${formatAmount(previousStats.expenses)}</div>
              </div>
              <div class="comparison-item">
                <div class="comparison-label">Netto</div>
                <div class="comparison-current ${currentStats.netto >= 0 ? 'positive' : 'negative'}">${formatAmount(currentStats.netto)}</div>
                <div class="comparison-previous">Föregående: ${formatAmount(previousStats.netto)}</div>
              </div>
            </div>
          </div>
          ` : ''}

          <!-- Monthly Breakdown Chart -->
          <div class="section">
            <div class="section-title">Månadsvis Resultaträkning</div>
            <div class="monthly-chart">
              <div class="chart-bars">
                ${monthlyBreakdown.map((month, i) => {
                  const maxValue = Math.max(...monthlyBreakdown.map(m => Math.max(m.income, m.expenses)), 1);
                  const incomeHeight = (month.income / maxValue) * 100;
                  const expenseHeight = (month.expenses / maxValue) * 100;
                  return `
                    <div class="chart-bar-group">
                      <div class="chart-bar income" style="height: ${incomeHeight}%"></div>
                      <div class="chart-bar expense" style="height: ${expenseHeight}%"></div>
                    </div>
                  `;
                }).join('')}
              </div>
              <div class="chart-labels">
                ${['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'].map(month => `<span>${month}</span>`).join('')}
              </div>
            </div>
          </div>

          <!-- Stats Grid -->
          <div class="stats-grid">
            <!-- Kassaflödesanalys -->
            <div class="stat-box">
              <div class="section-title" style="margin-top: 0; font-size: 18px;">Kassaflödesanalys</div>
              <div class="stat-row">
                <span class="stat-label">Total Inkomst</span>
                <span class="stat-value positive">${formatAmount(currentStats.income)}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Total Utgifter</span>
                <span class="stat-value negative">${formatAmount(currentStats.expenses)}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Netto Kassaflöde</span>
                <span class="stat-value ${currentStats.netto >= 0 ? 'positive' : 'negative'}">${formatAmount(currentStats.netto)}</span>
              </div>
              ${agreements.length > 0 ? `
              <div class="stat-row" style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
                <span class="stat-label">Fasta Kostnader (Avtal)</span>
                <span class="stat-value">${formatAmount(
                  agreements
                    .filter(a => a.status === 'Aktiv')
                    .reduce((sum, a) => sum + (parseFloat(a.cost) || 0), 0)
                )}</span>
              </div>
              ` : ''}
            </div>

            <!-- Kategorifördelning -->
            <div class="stat-box">
              <div class="section-title" style="margin-top: 0; font-size: 18px;">Kostnadsfördelning${includeLoans ? ' (inkl. lån)' : ''}</div>
              ${categoryBreakdown.length > 0 ? `
              <ul class="category-list">
                ${categoryBreakdown.map((cat, i) => {
                  const colors = ['#6366f1', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6', '#3b82f6', '#ec4899', '#06b6d4', '#f97316', '#14b8a6'];
                  const color = colors[i % colors.length];
                  return `
                    <li class="category-item">
                      <div class="category-name">
                        <div class="category-dot" style="background: ${color}"></div>
                        <span>${cat.name}</span>
                      </div>
                      <div class="category-info">
                        <span class="category-percent">${cat.percent.toFixed(1)}%</span>
                        <span class="category-amount">${formatAmount(cat.amount)}</span>
                      </div>
                    </li>
                  `;
                }).join('')}
              </ul>
              ` : '<p style="color: #9ca3af; text-align: center; padding: 20px;">Inga utgifter i denna period</p>'}
            </div>
          </div>

          <div class="footer">
            <p>Denna rapport genererades automatiskt av WestBudget</p>
            <p>© ${new Date().getFullYear()} WestBudget - Alla rättigheter förbehållna</p>
          </div>
        </body>
      </html>
    `;

    // Create blob and open in new window for printing
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
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
    }
    
    showToast('PDF-rapport öppnad för utskrift', { type: 'success' });
  };

  if (loading) {
    return <div className="text-center py-12">Laddar data...</div>;
  }

  const incomeTrend = previousStats ? getTrend(currentStats.income, previousStats.income) : null;
  const expenseTrend = previousStats ? getTrend(currentStats.expenses, previousStats.expenses) : null;
  const nettoTrend = previousStats ? getTrend(currentStats.netto, previousStats.netto) : null;

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
            onClick={() => setCompareMode(!compareMode)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              compareMode
                ? 'bg-indigo-600 text-white hover:bg-indigo-500'
                : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700'
            }`}
          >
            <BarChart3 size={16} />
            {compareMode ? 'Stäng Jämförelse' : 'Jämför Period'}
          </button>
          <button 
            onClick={handleExportPDF}
            className="flex items-center gap-2 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm"
          >
            <Download size={16} /> Exportera PDF
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Genomsnittlig Inkomst"
          amount={formatAmount(currentStats.avgIncome)}
          change={incomeTrend ? `${incomeTrend.value}%` : null}
          trend={incomeTrend?.direction}
          icon={<DollarSign className="text-emerald-500 dark:text-emerald-400" />}
        />
        <StatCard
          title="Genomsnittlig Utgift"
          amount={formatAmount(currentStats.avgExpense)}
          change={expenseTrend ? `${expenseTrend.value}%` : null}
          trend={expenseTrend?.direction}
          icon={<TrendingDown className="text-rose-500 dark:text-rose-400" />}
        />
        <StatCard
          title="Sparande"
          amount={formatAmount(currentStats.netto)}
          change={nettoTrend ? `${nettoTrend.value}%` : null}
          trend={nettoTrend?.direction}
          icon={<PiggyBank className={getAmountClassName(currentStats.netto)} />}
        />
        <StatCard
          title="Antal Transaktioner"
          amount={currentStats.transactionCount.toString()}
          icon={<BarChart3 className="text-indigo-500 dark:text-indigo-400" />}
        />
      </div>

      {/* Jämförelse-rad om aktiv */}
      {compareMode && previousStats && (
        <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/50 rounded-2xl p-6 shadow-sm dark:shadow-none">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Jämförelse med Föregående Period</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
              <div className="text-sm text-zinc-500 mb-1">Inkomst</div>
              <div className="text-2xl font-bold text-emerald-500 dark:text-emerald-400 mb-2">
                {formatAmount(currentStats.income)}
              </div>
              <div className="text-sm text-zinc-400">
                Föregående: {formatAmount(previousStats.income)}
              </div>
            </div>
            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
              <div className="text-sm text-zinc-500 mb-1">Utgifter</div>
              <div className="text-2xl font-bold text-rose-500 dark:text-rose-400 mb-2">
                {formatAmount(currentStats.expenses)}
              </div>
              <div className="text-sm text-zinc-400">
                Föregående: {formatAmount(previousStats.expenses)}
              </div>
            </div>
            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
              <div className="text-sm text-zinc-500 mb-1">Netto</div>
              <div className={`text-2xl font-bold mb-2 ${getAmountClassName(currentStats.netto)}`}>
                {formatAmount(currentStats.netto)}
              </div>
              <div className="text-sm text-zinc-400">
                Föregående: {formatAmount(previousStats.netto)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Månadsvis Diagram */}
      <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/50 rounded-2xl p-6 shadow-sm dark:shadow-none">
        <div className="flex items-center justify-between mb-8">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Resultaträkning (Månadsvis)</h3>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              <span className="text-zinc-500">Inkomster</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500"></div>
              <span className="text-zinc-500">Utgifter</span>
            </div>
          </div>
        </div>
        {monthlyBreakdown.some(m => m.income > 0 || m.expenses > 0) ? (
          <>
            <div className="h-72 w-full flex items-end justify-between gap-2">
              {monthlyBreakdown.map((month, i) => {
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];
                const netto = month.income - month.expenses;
                return (
                  <div key={i} className="flex-1 flex gap-1 h-full items-end justify-center group relative">
                    <div 
                      style={{ height: `${month.incomePercent}%` }} 
                      className="w-4 bg-emerald-500 rounded-t-sm opacity-80 group-hover:opacity-100 transition-all"
                    ></div>
                    <div 
                      style={{ height: `${month.expensesPercent}%` }} 
                      className="w-4 bg-rose-500 rounded-t-sm opacity-80 group-hover:opacity-100 transition-all"
                    ></div>
                    <div className="absolute -top-16 bg-zinc-800 text-white text-xs p-2 rounded opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap z-10">
                      <div className="font-semibold mb-1">{months[i]}</div>
                      <div>Inkomst: {formatAmount(month.income)}</div>
                      <div>Utgift: {formatAmount(month.expenses)}</div>
                      <div className={`mt-1 ${getAmountClassName(netto)}`}>
                        Netto: {formatAmount(netto)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-xs text-zinc-400 mt-4 border-t border-zinc-100 dark:border-zinc-800 pt-4 uppercase tracking-wider">
              {['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'].map((month, i) => (
                <span key={i}>{month}</span>
              ))}
            </div>
          </>
        ) : (
          <div className="h-72 flex items-center justify-center">
            <div className="text-center text-zinc-500 dark:text-zinc-400">
              <p className="text-lg mb-2">Inga transaktioner i denna period</p>
              <p className="text-sm">
                {getCurrentPeriodDates 
                  ? `Period: ${getCurrentPeriodDates.startDate} till ${getCurrentPeriodDates.endDate}`
                  : 'Välj en period för att se data'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Kategorifördelning */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/50 rounded-2xl p-6 shadow-sm dark:shadow-none">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <PieChart size={18} className="text-indigo-500 dark:text-indigo-400" />
              Kostnadsfördelning
            </h3>
            <button
              onClick={() => setShowCategorySelector(!showCategorySelector)}
              className="p-2 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              title="Välj kategorier"
            >
              <Settings2 size={16} />
            </button>
          </div>

          {/* Inkludera lån checkbox - alltid synlig om lån finns */}
          {loans && loans.length > 0 && (
            <div className="mb-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeLoans}
                  onChange={(e) => setIncludeLoans(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-zinc-300 rounded focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Inkludera lån (månadsbetalningar) i kostnadsfördelningen
                </span>
              </label>
              {includeLoans && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 ml-6">
                  {loans.filter(l => l.status === 'Aktiv').length} aktiv(a) lån läggs till
                </p>
              )}
            </div>
          )}

          {/* Kategoriväljare */}
          {showCategorySelector && (
            <div className="mb-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Välj kategorier att inkludera:</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedCategories(new Set(allCategories))}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Välj alla
                  </button>
                  <button
                    onClick={() => setSelectedCategories(new Set())}
                    className="text-xs text-zinc-600 dark:text-zinc-400 hover:underline"
                  >
                    Avmarkera alla
                  </button>
                </div>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {allCategories.map(cat => (
                  <label key={cat} className="flex items-center gap-2 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700/50 p-2 rounded">
                    <input
                      type="checkbox"
                      checked={selectedCategories.has(cat)}
                      onChange={(e) => {
                        const newSet = new Set(selectedCategories);
                        if (e.target.checked) {
                          newSet.add(cat);
                        } else {
                          newSet.delete(cat);
                        }
                        setSelectedCategories(newSet);
                      }}
                      className="w-4 h-4 text-indigo-600 border-zinc-300 rounded focus:ring-indigo-500"
                    />
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">{cat}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            {categoryBreakdown.length > 0 ? (
              categoryBreakdown.map((cat, i) => {
                const colors = [
                  'bg-indigo-500',
                  'bg-emerald-500',
                  'bg-rose-500',
                  'bg-amber-500',
                  'bg-purple-500',
                  'bg-blue-500',
                  'bg-pink-500',
                  'bg-cyan-500',
                  'bg-orange-500',
                  'bg-teal-500'
                ];
                const color = colors[i % colors.length];
                return (
                  <CategoryRow 
                    key={cat.name}
                    color={color} 
                    label={cat.name} 
                    percent={`${cat.percent.toFixed(1)}%`} 
                    value={formatAmount(cat.amount)}
                  />
                );
              })
            ) : (
              <div className="text-center text-zinc-500 py-8">Inga utgifter i denna period</div>
            )}
          </div>
        </div>

        {/* Kassaflödesanalys */}
        <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/50 rounded-2xl p-6 shadow-sm dark:shadow-none">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-6">Kassaflödesanalys</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
              <span className="text-sm text-zinc-500">Total Inkomst</span>
              <span className={`font-mono font-medium ${getAmountClassName(currentStats.income)}`}>
                {formatAmount(currentStats.income)}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
              <span className="text-sm text-zinc-500">Total Utgifter</span>
              <span className={`font-mono font-medium ${getAmountClassName(-currentStats.expenses)}`}>
                {formatAmount(-currentStats.expenses)}
              </span>
            </div>
            <div className="border-t border-dashed border-zinc-200 dark:border-zinc-700 my-4"></div>
            <div className="flex justify-between items-center">
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">Netto Kassaflöde:</span>
              <span className={`font-mono text-xl font-bold ${getAmountClassName(currentStats.netto)}`}>
                {formatAmount(currentStats.netto)}
              </span>
            </div>
            {agreements.length > 0 && (
              <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <div className="text-sm text-zinc-500 mb-2">Fasta Kostnader (Avtal)</div>
                <div className="text-lg font-semibold text-zinc-900 dark:text-white">
                  {formatAmount(
                    agreements
                      .filter(a => a.status === 'Aktiv')
                      .reduce((sum, a) => sum + (parseFloat(a.cost) || 0), 0)
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const CategoryRow = ({ color, label, percent, value }) => (
  <div className="flex items-center justify-between text-sm">
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${color}`}></div>
      <span className="text-zinc-600 dark:text-zinc-400">{label}</span>
    </div>
    <div className="flex items-center gap-3">
      <span className="text-xs font-bold text-zinc-400 dark:text-zinc-600">{percent}</span>
      <span className="font-medium text-zinc-900 dark:text-zinc-200">{value}</span>
    </div>
  </div>
);

export default ReportsTab;
