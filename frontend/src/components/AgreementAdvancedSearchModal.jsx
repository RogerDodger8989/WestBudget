import React, { useState, useEffect } from 'react';
import { Search, X, Filter, Calendar, Save, Star, Trash2 } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { api } from '../api';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeButtonClass, getThemeTextClass, getThemeBorderClass, getThemeRingClass, getThemeBgClass } from '../utils/getThemeClasses';

const AgreementAdvancedSearchModal = ({ 
  isOpen, 
  onClose, 
  categories = [],
  onSearch,
  savedSearches = [],
  onSaveSearch,
  onDeleteSearch,
  initialFilters = null
}) => {
  const { showToast } = useToast();
  const { colorTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    statuses: [], // Multi-select
    categories: [], // Multi-select
    frequency: 'all',
    hasImages: 'all',
    hasNotice: 'all',
    minCost: '',
    maxCost: '',
    dateFrom: '',
    dateTo: '',
    searchIn: ['name', 'provider', 'notice'] // Which fields to search in
  });
  const [searchName, setSearchName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('search'); // 'search' or 'saved'

  useEffect(() => {
    if (initialFilters) {
      // Handle backward compatibility: convert old 'status' to 'statuses' array
      const updatedFilters = { ...initialFilters };
      if (updatedFilters.status && !updatedFilters.statuses) {
        updatedFilters.statuses = updatedFilters.status === 'all' ? [] : [updatedFilters.status];
        delete updatedFilters.status;
      }
      setFilters(prev => ({ ...prev, ...updatedFilters }));
      if (initialFilters.query) {
        setSearchQuery(initialFilters.query);
      }
    }
  }, [initialFilters]);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setFilters({
        statuses: [],
        categories: [],
        frequency: 'all',
        hasImages: 'all',
        hasNotice: 'all',
        minCost: '',
        maxCost: '',
        dateFrom: '',
        dateTo: '',
        searchIn: ['name', 'provider', 'notice']
      });
      setSearchName('');
      setActiveTab('search');
    }
  }, [isOpen]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleCategoryToggle = (category) => {
    setFilters(prev => {
      const categories = prev.categories || [];
      const newCategories = categories.includes(category)
        ? categories.filter(c => c !== category)
        : [...categories, category];
      return { ...prev, categories: newCategories };
    });
  };

  const handleStatusToggle = (status) => {
    setFilters(prev => {
      const statuses = prev.statuses || [];
      const newStatuses = statuses.includes(status)
        ? statuses.filter(s => s !== status)
        : [...statuses, status];
      return { ...prev, statuses: newStatuses };
    });
  };

  const handleSearchInToggle = (field) => {
    setFilters(prev => {
      const searchIn = prev.searchIn || [];
      const newSearchIn = searchIn.includes(field)
        ? searchIn.filter(f => f !== field)
        : [...searchIn, field];
      return { ...prev, searchIn: newSearchIn };
    });
  };

  const handleApply = () => {
    const searchParams = {
      query: searchQuery,
      ...filters
    };
    onSearch(searchParams);
    onClose();
  };

  const handleReset = () => {
    setSearchQuery('');
    setFilters({
      status: 'all',
      categories: [],
      frequency: 'all',
      hasImages: 'all',
      hasNotice: 'all',
      minCost: '',
      maxCost: '',
      dateFrom: '',
      dateTo: '',
      searchIn: ['name', 'provider', 'notice']
    });
  };

  const handleSaveSearch = async () => {
    if (!searchName.trim()) {
      showToast('Ange ett namn för sökningen', { type: 'error' });
      return;
    }

    setIsSaving(true);
    try {
      const searchData = {
        name: searchName,
        query: searchQuery,
        filters: filters,
        entity_type: 'agreement' // Mark as agreement search
      };
      
      if (onSaveSearch) {
        await onSaveSearch(searchData);
        showToast('Sökning sparad!', { type: 'success' });
        setSearchName('');
      }
    } catch (error) {
      showToast('Kunde inte spara sökning', { type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadSearch = (savedSearch) => {
    setSearchQuery(savedSearch.query || '');
    setFilters(savedSearch.filters || {
      status: 'all',
      categories: [],
      frequency: 'all',
      hasImages: 'all',
      hasNotice: 'all',
      minCost: '',
      maxCost: '',
      dateFrom: '',
      dateTo: '',
      searchIn: ['name', 'provider', 'notice']
    });
    setActiveTab('search');
    showToast('Sökning laddad!', { type: 'success' });
  };

  const handleDeleteSearch = async (id) => {
    if (!confirm('Är du säker på att du vill ta bort denna sparade sökning?')) {
      return;
    }
    
    try {
      if (onDeleteSearch) {
        await onDeleteSearch(id);
        showToast('Sökning borttagen', { type: 'success' });
      }
    } catch (error) {
      showToast('Kunde inte ta bort sökning', { type: 'error' });
    }
  };

  const hasActiveFilters = () => {
    return searchQuery.trim() !== '' ||
           (filters.statuses && filters.statuses.length > 0) ||
           (filters.categories && filters.categories.length > 0) ||
           filters.frequency !== 'all' ||
           filters.hasImages !== 'all' ||
           filters.hasNotice !== 'all' ||
           filters.minCost !== '' ||
           filters.maxCost !== '' ||
           filters.dateFrom !== '' ||
           filters.dateTo !== '';
  };

  const categoryList = categories.map(c => typeof c === 'string' ? c : c.name || c);

  // Helper function to get active tab classes
  const getActiveTabClass = () => {
    const themeMap = {
      indigo: 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/10',
      blue: 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50/50 dark:bg-blue-900/10',
      emerald: 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/10',
      purple: 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400 bg-purple-50/50 dark:bg-purple-900/10',
      rose: 'text-rose-600 dark:text-rose-400 border-b-2 border-rose-600 dark:border-rose-400 bg-rose-50/50 dark:bg-rose-900/10',
      amber: 'text-amber-600 dark:text-amber-400 border-b-2 border-amber-600 dark:border-amber-400 bg-amber-50/50 dark:bg-amber-900/10'
    };
    return themeMap[colorTheme] || themeMap.indigo;
  };

  // Helper function to get hover button classes
  const getHoverButtonClass = () => {
    const themeMap = {
      indigo: 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30',
      blue: 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30',
      emerald: 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30',
      purple: 'text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30',
      rose: 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30',
      amber: 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30'
    };
    return themeMap[colorTheme] || themeMap.indigo;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between flex-shrink-0">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <Search size={20} className={getThemeTextClass(colorTheme, false)} />
            Avancerad Sökning - Avtal
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
            <X size={20} className="text-zinc-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0">
          <button
            onClick={() => setActiveTab('search')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'search'
                ? getActiveTabClass()
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <Search size={16} className="inline mr-2" />
            Sök
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'saved'
                ? getActiveTabClass()
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <Star size={16} className="inline mr-2" />
            Sparade ({savedSearches.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0">
          {activeTab === 'search' ? (
            <>
              {/* Search Query */}
              <div>
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2 block">
                  Söktext
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Sök i namn, leverantör, notering..."
                  className={`w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 ${getThemeRingClass(colorTheme)} outline-none`}
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">Sök i:</span>
                  {['name', 'provider', 'notice'].map(field => (
                    <label key={field} className="flex items-center gap-1 text-xs">
                      <input
                        type="checkbox"
                        checked={filters.searchIn?.includes(field) || false}
                        onChange={() => handleSearchInToggle(field)}
                        className={`rounded border-zinc-300 dark:border-zinc-600 ${getThemeTextClass(colorTheme, false)} ${getThemeRingClass(colorTheme)}`}
                      />
                      <span className="text-zinc-600 dark:text-zinc-400">
                        {field === 'name' ? 'Namn' : field === 'provider' ? 'Leverantör' : 'Notering'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Date Range */}
              <div>
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2 block flex items-center gap-2">
                  <Calendar size={16} className={getThemeTextClass(colorTheme, false)} />
                  Datumintervall (Startdatum / Slutdatum)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 block">Från</label>
                    <input
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                      className={`w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:ring-2 ${getThemeRingClass(colorTheme)} outline-none`}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 block">Till</label>
                    <input
                      type="date"
                      value={filters.dateTo}
                      onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                      className={`w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:ring-2 ${getThemeRingClass(colorTheme)} outline-none`}
                    />
                  </div>
                </div>
              </div>

              {/* Status Filter - Multi-select */}
              <div>
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2 block">
                  Status (välj flera)
                </label>
                <div className="max-h-40 overflow-y-auto border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 space-y-1">
                  {['Aktiv', 'Pausad', 'Uppsagd'].map(status => (
                    <label key={status} className="flex items-center gap-2 p-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.statuses?.includes(status) || false}
                        onChange={() => handleStatusToggle(status)}
                        className={`rounded border-zinc-300 dark:border-zinc-600 ${getThemeTextClass(colorTheme, false)} ${getThemeRingClass(colorTheme)}`}
                      />
                      <span className="text-sm text-zinc-700 dark:text-zinc-300">{status}</span>
                    </label>
                  ))}
                </div>
                {filters.statuses && filters.statuses.length > 0 && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    {filters.statuses.length} status(ar) valda
                  </p>
                )}
              </div>

              {/* Categories - Multi-select */}
              <div>
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2 block">
                  Kategorier (välj flera)
                </label>
                <div className="max-h-40 overflow-y-auto border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 space-y-1">
                  {categoryList.length === 0 ? (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 p-2">Inga kategorier tillgängliga</p>
                  ) : (
                    categoryList.map(cat => (
                      <label key={cat} className="flex items-center gap-2 p-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.categories?.includes(cat) || false}
                          onChange={() => handleCategoryToggle(cat)}
                          className={`rounded border-zinc-300 dark:border-zinc-600 ${getThemeTextClass(colorTheme, false)} ${getThemeRingClass(colorTheme)}`}
                        />
                        <span className="text-sm text-zinc-700 dark:text-zinc-300">{cat}</span>
                      </label>
                    ))
                  )}
                </div>
                {filters.categories && filters.categories.length > 0 && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    {filters.categories.length} kategori(er) valda
                  </p>
                )}
              </div>

              {/* Frequency Filter */}
              <div>
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2 block">
                  Betalningsfrekvens
                </label>
                <div className="flex flex-wrap gap-2">
                  {['all', 'Månadsvis', 'Kvartalsvis', 'Halvårlig', 'Årlig'].map(frequency => (
                    <button
                      key={frequency}
                      onClick={() => handleFilterChange('frequency', frequency)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        filters.frequency === frequency
                          ? `${getThemeButtonClass(colorTheme, 'primary')} shadow-lg`
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                      }`}
                    >
                      {frequency === 'all' ? 'Alla' : frequency}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount Range */}
              <div>
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2 block">
                  Kostnadsintervall (kr)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 block">Min kostnad</label>
                    <input
                      type="number"
                      value={filters.minCost}
                      onChange={(e) => handleFilterChange('minCost', e.target.value)}
                      placeholder="0"
                      className={`w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:ring-2 ${getThemeRingClass(colorTheme)} outline-none`}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 block">Max kostnad</label>
                    <input
                      type="number"
                      value={filters.maxCost}
                      onChange={(e) => handleFilterChange('maxCost', e.target.value)}
                      placeholder="Ingen gräns"
                      className={`w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:ring-2 ${getThemeRingClass(colorTheme)} outline-none`}
                    />
                  </div>
                </div>
              </div>

              {/* Has Images / Has Notice */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2 block">
                    Har Bild
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['all', 'yes', 'no'].map(option => (
                      <button
                        key={option}
                        onClick={() => handleFilterChange('hasImages', option)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          filters.hasImages === option
                            ? getThemeButtonClass(colorTheme, 'primary')
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                        }`}
                      >
                        {option === 'all' ? 'Alla' : option === 'yes' ? 'Ja' : 'Nej'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2 block">
                    Har Notering
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['all', 'yes', 'no'].map(option => (
                      <button
                        key={option}
                        onClick={() => handleFilterChange('hasNotice', option)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          filters.hasNotice === option
                            ? getThemeButtonClass(colorTheme, 'primary')
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                        }`}
                      >
                        {option === 'all' ? 'Alla' : option === 'yes' ? 'Ja' : 'Nej'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Save Search */}
              <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2 block">
                  Spara sökning
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                    placeholder="Namn på sökningen..."
                    className={`flex-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:ring-2 ${getThemeRingClass(colorTheme)} outline-none`}
                  />
                  <button
                    onClick={handleSaveSearch}
                    disabled={isSaving || !searchName.trim() || !hasActiveFilters()}
                    className={`px-4 py-2 ${getThemeButtonClass(colorTheme, 'primary')} rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2`}
                  >
                    <Save size={16} />
                    {isSaving ? 'Sparar...' : 'Spara'}
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* Saved Searches */
            <div className="space-y-2">
              {savedSearches.length === 0 ? (
                <div className="text-center py-12">
                  <Star size={48} className="mx-auto text-zinc-300 dark:text-zinc-700 mb-4" />
                  <p className="text-zinc-500 dark:text-zinc-400">Inga sparade sökningar</p>
                </div>
              ) : (
                savedSearches.map(search => (
                  <div
                    key={search.id}
                    className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 flex items-center justify-between hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium text-zinc-900 dark:text-white">{search.name}</h3>
                      {search.query && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">"{search.query}"</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleLoadSearch(search)}
                        className={`p-2 ${getHoverButtonClass()} rounded-lg transition-colors`}
                        title="Ladda sökning"
                      >
                        <Search size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteSearch(search.id)}
                        className="p-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                        title="Ta bort"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {activeTab === 'search' && (
          <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center flex-shrink-0">
            <button
              onClick={handleReset}
              className="px-4 py-2 text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-sm font-medium"
            >
              Återställ
            </button>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-sm font-medium"
              >
                Avbryt
              </button>
              <button
                onClick={handleApply}
                className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
                  hasActiveFilters()
                    ? `${getThemeButtonClass(colorTheme, 'primary')} shadow-lg`
                    : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 cursor-not-allowed'
                }`}
                disabled={!hasActiveFilters()}
              >
                Sök
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgreementAdvancedSearchModal;

