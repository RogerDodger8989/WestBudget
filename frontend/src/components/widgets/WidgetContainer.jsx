import React from 'react';
import { GripVertical, X } from 'lucide-react';

const WidgetContainer = ({ 
  widget, 
  onRemove, 
  onEdit,
  children,
  isDragging = false 
}) => {
  return (
    <div 
      className={`bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/50 rounded-xl p-4 shadow-sm dark:shadow-none transition-all ${
        isDragging ? 'opacity-50 scale-95' : 'opacity-100'
      }`}
    >
      {/* Widget Header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="cursor-move text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
            <GripVertical size={16} />
          </div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
            {widget.title || widget.type}
          </h3>
        </div>
        <div className="flex items-center gap-1">
          {onEdit && (
            <button
              onClick={() => onEdit(widget)}
              className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded transition-colors"
              title="Redigera widget"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          )}
          {onRemove && (
            <button
              onClick={() => onRemove(widget.id)}
              className="p-1 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 rounded transition-colors"
              title="Ta bort widget"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>
      
      {/* Widget Content */}
      <div className="widget-content">
        {children}
      </div>
    </div>
  );
};

export default WidgetContainer;

