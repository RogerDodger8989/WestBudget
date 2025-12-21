import React, { useState } from 'react';
import { GripVertical, Plus, Settings } from 'lucide-react';
import WidgetContainer from './WidgetContainer';
import KPIWidget from './KPIWidget';
import ChartWidget from './ChartWidget';
import TransactionListWidget from './TransactionListWidget';
import CategoryDistributionWidget from './CategoryDistributionWidget';
import SavingsProgressWidget from './SavingsProgressWidget';
import LoansOverviewWidget from './LoansOverviewWidget';

const WidgetGrid = ({ 
  widgets = [], 
  onAddWidget, 
  onRemoveWidget, 
  onEditWidget,
  onReorderWidgets,
  widgetData = {},
  onTransactionClick,
  onNoteClick,
  isEditMode = false
}) => {
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const renderWidget = (widget) => {
    const data = widgetData[widget.id] || {};
    
    switch (widget.type) {
      case 'kpi':
        return <KPIWidget widget={widget} data={data} />;
      case 'chart':
        return <ChartWidget widget={widget} data={data} />;
      case 'transaction-list':
        return (
          <TransactionListWidget 
            widget={widget} 
            data={data}
            onTransactionClick={onTransactionClick}
            onNoteClick={onNoteClick}
          />
        );
      case 'category-distribution':
        return <CategoryDistributionWidget widget={widget} data={data} />;
      case 'savings-progress':
        return <SavingsProgressWidget widget={widget} data={data} />;
      case 'loans-overview':
        return <LoansOverviewWidget widget={widget} data={data} />;
      default:
        return <div className="text-zinc-500 dark:text-zinc-400 text-sm">Okänd widget-typ</div>;
    }
  };

  const handleDragStart = (index) => {
    if (!isEditMode) return;
    setDraggedIndex(index);
  };

  const handleDragOver = (e, index) => {
    if (!isEditMode || draggedIndex === null) return;
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (e, dropIndex) => {
    if (!isEditMode || draggedIndex === null) return;
    e.preventDefault();
    
    if (draggedIndex !== dropIndex && onReorderWidgets) {
      const newWidgets = [...widgets];
      const [removed] = newWidgets.splice(draggedIndex, 1);
      newWidgets.splice(dropIndex, 0, removed);
      onReorderWidgets(newWidgets);
    }
    
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Calculate grid columns based on widget count
  const getGridCols = () => {
    if (widgets.length === 0) return 'grid-cols-1';
    if (widgets.length === 1) return 'grid-cols-1';
    if (widgets.length === 2) return 'grid-cols-1 md:grid-cols-2';
    return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
  };

  // Check if widget should span full width
  const shouldSpanFullWidth = (widget) => {
    return widget.type === 'transaction-list' || widget.type === 'category-distribution';
  };

  return (
    <div className="space-y-6">
      {/* Add Widget Button (only in edit mode) */}
      {isEditMode && onAddWidget && (
        <button
          onClick={onAddWidget}
          className="w-full p-6 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-all flex items-center justify-center gap-2 text-zinc-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400"
        >
          <Plus size={20} />
          <span className="font-medium">Lägg till widget</span>
        </button>
      )}

      {/* Widget Grid */}
      {widgets.length === 0 ? (
        <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
          <p className="mb-2">Inga widgets ännu</p>
          {isEditMode && onAddWidget && (
            <button
              onClick={onAddWidget}
              className="text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Lägg till din första widget
            </button>
          )}
        </div>
      ) : (
        <div className={`grid ${getGridCols()} gap-6`}>
          {widgets.map((widget, index) => (
            <div
              key={widget.id}
              draggable={isEditMode}
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={`transition-all ${
                shouldSpanFullWidth(widget) ? 'col-span-full' : ''
              } ${
                dragOverIndex === index && draggedIndex !== index
                  ? 'scale-105 border-2 border-indigo-500'
                  : ''
              }`}
            >
              <WidgetContainer
                widget={widget}
                onRemove={isEditMode ? onRemoveWidget : null}
                onEdit={isEditMode ? onEditWidget : null}
                isDragging={draggedIndex === index}
              >
                {renderWidget(widget)}
              </WidgetContainer>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WidgetGrid;

