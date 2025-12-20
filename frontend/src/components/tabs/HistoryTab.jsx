import React, { useState, useEffect } from 'react';
import { History, RotateCcw, Trash2, Filter, X, Calendar, FileText, Tag, Car, Receipt, PiggyBank, AlertCircle, CheckCircle, Plus, Edit2, Link2 } from 'lucide-react';
import { api } from '../../api';
import { useToast } from '../../contexts/ToastContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getThemeButtonClass, getThemeTextClass, getThemeBgClass, getThemeRingClass } from '../../utils/getThemeClasses';

const HistoryTab = ({ reloadData }) => {
  const { showToast } = useToast();
  const { colorTheme } = useTheme();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all'); // 'all', 'transaction', 'agreement', 'loan', etc.
  const [filterAction, setFilterAction] = useState('all'); // 'all', 'create', 'update', 'delete', etc.
  const [undoingId, setUndoingId] = useState(null);

  useEffect(() => {
    loadHistory();
  }, [filterType, filterAction]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await api.getHistory(500, filterType !== 'all' ? filterType : null);
      
      // Filter by action type if specified
      let filtered = data;
      if (filterAction !== 'all') {
        filtered = data.filter(h => h.action_type === filterAction);
      }
      
      setHistory(filtered);
    } catch (error) {
      console.error('Error loading history:', error);
      showToast('Kunde inte ladda historik', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleUndo = async (historyId, entry) => {
    if (undoingId) return;
    
    try {
      setUndoingId(historyId);
      await api.undoHistoryAction(historyId);
      showToast('Åtgärd ångrad!', { type: 'success' });
      
      // Reload data and history
      if (reloadData) {
        await reloadData();
      }
      await loadHistory();
    } catch (error) {
      console.error('Error undoing action:', error);
      showToast(error.message || 'Kunde inte ångra åtgärden', { type: 'error' });
    } finally {
      setUndoingId(null);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm('Är du säker på att du vill radera all historik? Detta kan inte ångras.')) {
      return;
    }

    try {
      await api.clearHistory();
      setHistory([]);
      showToast('Historik raderad', { type: 'success' });
    } catch (error) {
      console.error('Error clearing history:', error);
      showToast('Kunde inte radera historik', { type: 'error' });
    }
  };

  const getEntityIcon = (entityType) => {
    switch (entityType) {
      case 'transaction':
        return <FileText size={16} />;
      case 'agreement':
        return <Receipt size={16} />;
      case 'loan':
        return <Receipt size={16} />;
      case 'vehicle':
        return <Car size={16} />;
      case 'savings':
        return <PiggyBank size={16} />;
      case 'category':
        return <Tag size={16} />;
      default:
        return <FileText size={16} />;
    }
  };

  const getActionIcon = (actionType) => {
    switch (actionType) {
      case 'create':
        return <Plus size={14} className="text-emerald-500" />;
      case 'update':
        return <Edit2 size={14} className="text-blue-500" />;
      case 'delete':
        return <Trash2 size={14} className="text-rose-500" />;
      case 'restore':
        return <RotateCcw size={14} className="text-amber-500" />;
      case 'link':
        return <Link2 size={14} className="text-indigo-500" />;
      default:
        return <AlertCircle size={14} />;
    }
  };

  const getActionColor = (actionType) => {
    switch (actionType) {
      case 'create':
        return 'text-emerald-600 dark:text-emerald-400';
      case 'update':
        return 'text-blue-600 dark:text-blue-400';
      case 'delete':
        return 'text-rose-600 dark:text-rose-400';
      case 'restore':
        return 'text-amber-600 dark:text-amber-400';
      case 'link':
        return 'text-indigo-600 dark:text-indigo-400';
      default:
        return 'text-zinc-600 dark:text-zinc-400';
    }
  };

  const canUndo = (entry) => {
    // Can undo if it's a delete, create, or update action
    return ['delete', 'create', 'update'].includes(entry.action_type) && entry.undo_data !== null;
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just nu';
    if (diffMins < 60) return `För ${diffMins} min sedan`;
    if (diffHours < 24) return `För ${diffHours} tim sedan`;
    if (diffDays < 7) return `För ${diffDays} dagar sedan`;
    
    return date.toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredHistory = history.filter(entry => {
    if (filterType !== 'all' && entry.entity_type !== filterType) return false;
    if (filterAction !== 'all' && entry.action_type !== filterAction) return false;
    return true;
  });

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-3">
            <History className={getThemeTextClass(colorTheme, false)} size={28} />
            Historik
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
            Se och ångra senaste åtgärder
          </p>
        </div>
        <button
          onClick={handleClearHistory}
          className={`flex items-center gap-2 ${getThemeButtonClass(colorTheme, 'outline')} px-4 py-2 rounded-xl text-sm font-medium transition-all`}
        >
          <Trash2 size={16} />
          Rensa historik
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/50 rounded-2xl p-4 shadow-sm dark:shadow-none">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-zinc-500" />
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Filtrera:</span>
          </div>
          
          {/* Entity Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className={`px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 ${getThemeRingClass(colorTheme)}`}
          >
            <option value="all">Alla typer</option>
            <option value="transaction">Transaktioner</option>
            <option value="agreement">Avtal</option>
            <option value="loan">Lån</option>
            <option value="vehicle">Fordon</option>
            <option value="savings">Sparande</option>
            <option value="category">Kategorier</option>
          </select>

          {/* Action Type Filter */}
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className={`px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 ${getThemeRingClass(colorTheme)}`}
          >
            <option value="all">Alla åtgärder</option>
            <option value="create">Skapade</option>
            <option value="update">Uppdaterade</option>
            <option value="delete">Raderade</option>
            <option value="restore">Återställde</option>
            <option value="link">Kopplade</option>
          </select>

          {(filterType !== 'all' || filterAction !== 'all') && (
            <button
              onClick={() => {
                setFilterType('all');
                setFilterAction('all');
              }}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
            >
              <X size={14} />
              Rensa filter
            </button>
          )}
        </div>
      </div>

      {/* History List */}
      <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/50 rounded-2xl shadow-sm dark:shadow-none overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 dark:border-white"></div>
            <p className="mt-4 text-sm text-zinc-500">Laddar historik...</p>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="p-12 text-center">
            <History size={48} className="mx-auto text-zinc-400 mb-4" />
            <p className="text-sm text-zinc-500">Ingen historik hittades</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {filteredHistory.map((entry) => (
              <div
                key={entry.id}
                className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`p-2 rounded-lg ${getThemeBgClass(colorTheme, false)} dark:${getThemeBgClass(colorTheme, true)}`}>
                      {getEntityIcon(entry.entity_type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {getActionIcon(entry.action_type)}
                        <span className={`font-medium text-sm ${getActionColor(entry.action_type)}`}>
                          {entry.action}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                        <Calendar size={12} />
                        <span>{formatDate(entry.timestamp)}</span>
                        {entry.entity_id && (
                          <>
                            <span>•</span>
                            <span>ID: {entry.entity_id}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {canUndo(entry) && (
                    <button
                      onClick={() => handleUndo(entry.id, entry)}
                      disabled={undoingId === entry.id}
                      className={`flex items-center gap-2 ${getThemeButtonClass(colorTheme, 'outline')} px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {undoingId === entry.id ? (
                        <>
                          <div className="inline-block animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                          Ångrar...
                        </>
                      ) : (
                        <>
                          <RotateCcw size={14} />
                          Ångra
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryTab;

