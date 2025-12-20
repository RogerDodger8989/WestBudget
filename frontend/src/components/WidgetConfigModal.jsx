import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { TrendingUp, TrendingDown, BarChart3, List, PieChart } from 'lucide-react';

const WidgetConfigModal = ({ 
  isOpen, 
  onClose, 
  widget = null, 
  onSave,
  availableData = {}
}) => {
  const [widgetType, setWidgetType] = useState(widget?.type || 'kpi');
  const [config, setConfig] = useState(widget?.config || {});

  useEffect(() => {
    if (widget) {
      setWidgetType(widget.type);
      setConfig(widget.config || {});
    } else {
      setWidgetType('kpi');
      setConfig({});
    }
  }, [widget, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    const widgetData = {
      id: widget?.id || Date.now().toString(),
      type: widgetType,
      config: config,
      title: config.title || getDefaultTitle(widgetType)
    };
    onSave(widgetData);
    onClose();
  };

  const getDefaultTitle = (type) => {
    const titles = {
      kpi: 'KPI',
      chart: 'Diagram',
      'transaction-list': 'Transaktionslista',
      'category-distribution': 'Kategorifördelning'
    };
    return titles[type] || 'Widget';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between flex-shrink-0">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
            {widget ? 'Redigera Widget' : 'Lägg till Widget'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
            <X size={20} className="text-zinc-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0">
          {/* Widget Type Selection */}
          <div>
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3 block">
              Widget-typ
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { type: 'kpi', label: 'KPI-kort', icon: TrendingUp },
                { type: 'chart', label: 'Diagram', icon: BarChart3 },
                { type: 'transaction-list', label: 'Transaktionslista', icon: List },
                { type: 'category-distribution', label: 'Kategorifördelning', icon: PieChart }
              ].map(({ type, label, icon: Icon }) => (
                <button
                  key={type}
                  onClick={() => setWidgetType(type)}
                  className={`p-4 border-2 rounded-xl transition-all text-left ${
                    widgetType === type
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                      : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                  }`}
                >
                  <Icon size={24} className={`mb-2 ${
                    widgetType === type 
                      ? 'text-indigo-600 dark:text-indigo-400' 
                      : 'text-zinc-400'
                  }`} />
                  <div className="text-sm font-medium text-zinc-900 dark:text-white">
                    {label}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Widget Title */}
          <div>
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2 block">
              Titel
            </label>
            <input
              type="text"
              value={config.title || getDefaultTitle(widgetType)}
              onChange={(e) => setConfig({ ...config, title: e.target.value })}
              placeholder="Widget-titel"
              className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          {/* Type-specific Configuration */}
          {widgetType === 'kpi' && (
            <>
              <div>
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2 block">
                  Etikett
                </label>
                <input
                  type="text"
                  value={config.label || ''}
                  onChange={(e) => setConfig({ ...config, label: e.target.value })}
                  placeholder="t.ex. Inkomst, Utgifter, Netto"
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2 block">
                  Färg
                </label>
                <div className="flex gap-2">
                  {['indigo', 'emerald', 'rose', 'amber', 'blue'].map(color => (
                    <button
                      key={color}
                      onClick={() => setConfig({ ...config, color })}
                      className={`w-10 h-10 rounded-lg border-2 transition-all ${
                        config.color === color
                          ? 'border-zinc-900 dark:border-white scale-110'
                          : 'border-zinc-300 dark:border-zinc-600'
                      } ${
                        color === 'indigo' ? 'bg-indigo-500' :
                        color === 'emerald' ? 'bg-emerald-500' :
                        color === 'rose' ? 'bg-rose-500' :
                        color === 'amber' ? 'bg-amber-500' :
                        'bg-blue-500'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          {widgetType === 'transaction-list' && (
            <div>
              <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2 block">
                Antal transaktioner
              </label>
              <input
                type="number"
                value={config.limit || 5}
                onChange={(e) => setConfig({ ...config, limit: parseInt(e.target.value) || 5 })}
                min="1"
                max="20"
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <label className="flex items-center gap-2 mt-3">
                <input
                  type="checkbox"
                  checked={config.showCategory !== false}
                  onChange={(e) => setConfig({ ...config, showCategory: e.target.checked })}
                  className="rounded border-zinc-300 dark:border-zinc-600 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-zinc-700 dark:text-zinc-300">Visa kategori</span>
              </label>
            </div>
          )}

          {widgetType === 'chart' && (
            <div>
              <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2 block">
                Diagramtyp
              </label>
              <div className="flex gap-2">
                {['bar', 'line', 'pie'].map(type => (
                  <button
                    key={type}
                    onClick={() => setConfig({ ...config, chartType: type })}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      config.chartType === type
                        ? 'bg-indigo-600 text-white'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    {type === 'bar' ? 'Stapel' : type === 'line' ? 'Linje' : 'Cirkel'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {widgetType === 'category-distribution' && (
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={config.showPercentages !== false}
                onChange={(e) => setConfig({ ...config, showPercentages: e.target.checked })}
                className="rounded border-zinc-300 dark:border-zinc-600 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-zinc-700 dark:text-zinc-300">Visa procent</span>
            </label>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-sm font-medium"
          >
            Avbryt
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium flex items-center gap-2"
          >
            <Save size={16} />
            Spara
          </button>
        </div>
      </div>
    </div>
  );
};

export default WidgetConfigModal;

