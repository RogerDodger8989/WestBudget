import React, { useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTheme } from '../../contexts/ThemeContext';

const ChartWidget = ({ widget, data }) => {
  const { chartType = 'bar', title, dataType = 'income-expense' } = widget.config || {};
  const { colorTheme } = useTheme();
  
  // Get theme colors
  const getThemeColor = () => {
    const colors = {
      indigo: { primary: '#6366f1', secondary: '#818cf8' },
      blue: { primary: '#3b82f6', secondary: '#60a5fa' },
      emerald: { primary: '#10b981', secondary: '#34d399' },
      purple: { primary: '#a855f7', secondary: '#c084fc' },
      rose: { primary: '#f43f5e', secondary: '#fb7185' },
      amber: { primary: '#f59e0b', secondary: '#fbbf24' }
    };
    return colors[colorTheme] || colors.indigo;
  };

  const themeColors = getThemeColor();
  const isDark = document.documentElement.classList.contains('dark');
  
  // Prepare chart data based on dataType
  const chartData = useMemo(() => {
    if (!data || !data.transactions) return [];

    const transactions = data.transactions || [];
    
    if (dataType === 'income-expense') {
      // Group by month
      const monthlyData = {};
      transactions.forEach(t => {
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
      
      return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
    } else if (dataType === 'category') {
      // Category distribution
      const categoryMap = {};
      transactions.forEach(t => {
        if (t.type === 'expense') {
          const categoryName = typeof t.category === 'string' ? t.category : t.category?.name || 'Övrigt';
          const amountStr = t.amount?.replace(/[^\d,.-]/g, '').replace(',', '') || '0';
          const amount = Math.abs(parseFloat(amountStr) || 0);
          categoryMap[categoryName] = (categoryMap[categoryName] || 0) + amount;
        }
      });
      
      return Object.entries(categoryMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10); // Top 10 categories
    } else if (dataType === 'daily') {
      // Daily trend (last 30 days)
      const dailyData = {};
      const today = new Date();
      for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateKey = date.toISOString().split('T')[0];
        const dateLabel = date.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' });
        dailyData[dateKey] = { date: dateLabel, belopp: 0 };
      }
      
      transactions.forEach(t => {
        if (!t.date) return;
        const dateKey = t.date.split('T')[0];
        if (dailyData[dateKey]) {
          const amountStr = t.amount?.replace(/[^\d,.-]/g, '').replace(',', '') || '0';
          const amount = parseFloat(amountStr) || 0;
          dailyData[dateKey].belopp += Math.abs(amount);
        }
      });
      
      return Object.values(dailyData);
    }
    
    return [];
  }, [data, dataType]);

  const renderChart = () => {
    if (chartData.length === 0) {
      return (
        <div className="h-48 flex items-center justify-center bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Ingen data tillgänglig</p>
        </div>
      );
    }

    const COLORS = [
      themeColors.primary,
      themeColors.secondary,
      '#8b5cf6',
      '#ec4899',
      '#14b8a6',
      '#f59e0b',
      '#ef4444',
      '#06b6d4',
      '#84cc16',
      '#f97316'
    ];

    switch (chartType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#3f3f46' : '#e4e4e7'} />
              <XAxis 
                dataKey={dataType === 'daily' ? 'date' : 'month'} 
                stroke={isDark ? '#a1a1aa' : '#71717a'}
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke={isDark ? '#a1a1aa' : '#71717a'}
                style={{ fontSize: '12px' }}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: isDark ? '#18181b' : '#ffffff',
                  border: `1px solid ${isDark ? '#3f3f46' : '#e4e4e7'}`,
                  borderRadius: '8px',
                  color: isDark ? '#f4f4f5' : '#18181b'
                }}
                formatter={(value) => `${(value / 1000).toFixed(1)}k kr`}
              />
              <Legend />
              {dataType === 'income-expense' ? (
                <>
                  <Line 
                    type="monotone" 
                    dataKey="inkomst" 
                    stroke={themeColors.primary} 
                    strokeWidth={2}
                    name="Inkomst"
                    dot={{ r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="utgifter" 
                    stroke={themeColors.secondary} 
                    strokeWidth={2}
                    name="Utgifter"
                    dot={{ r: 4 }}
                  />
                </>
              ) : (
                <Line 
                  type="monotone" 
                  dataKey="belopp" 
                  stroke={themeColors.primary} 
                  strokeWidth={2}
                  name="Belopp"
                  dot={{ r: 4 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        );
      
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: isDark ? '#18181b' : '#ffffff',
                  border: `1px solid ${isDark ? '#3f3f46' : '#e4e4e7'}`,
                  borderRadius: '8px',
                  color: isDark ? '#f4f4f5' : '#18181b'
                }}
                formatter={(value) => `${(value / 1000).toFixed(1)}k kr`}
              />
            </PieChart>
          </ResponsiveContainer>
        );
      
      default: // bar
        return (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#3f3f46' : '#e4e4e7'} />
              <XAxis 
                dataKey={dataType === 'daily' ? 'date' : dataType === 'category' ? 'name' : 'month'} 
                stroke={isDark ? '#a1a1aa' : '#71717a'}
                style={{ fontSize: '12px' }}
                angle={dataType === 'category' ? -45 : 0}
                textAnchor={dataType === 'category' ? 'end' : 'middle'}
                height={dataType === 'category' ? 80 : 30}
              />
              <YAxis 
                stroke={isDark ? '#a1a1aa' : '#71717a'}
                style={{ fontSize: '12px' }}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: isDark ? '#18181b' : '#ffffff',
                  border: `1px solid ${isDark ? '#3f3f46' : '#e4e4e7'}`,
                  borderRadius: '8px',
                  color: isDark ? '#f4f4f5' : '#18181b'
                }}
                formatter={(value) => `${(value / 1000).toFixed(1)}k kr`}
              />
              <Legend />
              {dataType === 'income-expense' ? (
                <>
                  <Bar dataKey="inkomst" fill={themeColors.primary} name="Inkomst" />
                  <Bar dataKey="utgifter" fill={themeColors.secondary} name="Utgifter" />
                </>
              ) : (
                <Bar dataKey={dataType === 'category' ? 'value' : 'belopp'} fill={themeColors.primary} />
              )}
            </BarChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <div className="space-y-2">
      {title && (
        <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          {title}
        </h4>
      )}
      {renderChart()}
    </div>
  );
};

export default ChartWidget;
