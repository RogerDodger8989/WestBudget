import React, { useState, useEffect } from 'react';
import { Search, X, Filter, Calendar, Save, Star, Trash2, SlidersHorizontal } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { api } from '../api';

const AdvancedSearchModal = ({ 
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
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    type: 'all',
    categories: [], // Multi-select
    status: 'all',
    hasReceipt: 'all',
    hasNote: 'all',
    minAmount: '',
    maxAmount: '',
    dateFrom: '',
    dateTo: '',
    searchIn: ['title', 'description', 'note', 'reference'] // Which fields to search in
  });
  const [searchName, setSearchName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('search'); // 'search' or 'saved'

  useEffect(() => {
    if (initialFilters) {
      setFilters(prev => ({ ...prev, ...initialFilters }));
    }
  }, [initialFilters]);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setFilters({
        type: 'all',
        categories: [],
        status: 'all',
        hasReceipt: 'all',
        hasNote: 'all',
        minAmount: '',
        maxAmount: '',
        dateFrom: '',
        dateTo: '',
        searchIn: ['title', 'description', 'note', 'reference']
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
      type: 'all',
      categories: [],
      status: 'all',
      hasReceipt: 'all',
      hasNote: 'all',
      minAmount: '',
      maxAmount: '',
      dateFrom: '',
      dateTo: '',
      searchIn: ['title', 'description', 'note', 'reference']
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
        filters: filters
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
      type: 'all',
      categories: [],
      status: 'all',
      hasReceipt: 'all',
      hasNote: 'all',
      minAmount: '',
      maxAmount: '',
      dateFrom: '',
      dateTo: '',
      searchIn: ['title', 'description', 'note', 'reference']
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
           filters.type !== 'all' ||
           (filters.categories && filters.categories.length > 0) ||
           filters.status !== 'all' ||
           filters.hasReceipt !== 'all' ||
           filters.hasNote !== 'all' ||
           filters.minAmount !== '' ||
           filters.maxAmount !== '' ||
           filters.dateFrom !== '' ||
           filters.dateTo !== '';
  };

  const categoryList = categories.map(c => typeof c === 'string' ? c : c.name || c);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between flex-shrink-0">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <Search size={20} className="text-indigo-500" />
            Avancerad Sökning
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
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/10'
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
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/10'
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
                  placeholder="Sök i titel, beskrivning, noteringar, referens..."
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">Sök i:</span>
                  {['title', 'description', 'note', 'reference'].map(field => (
                    <label key={field} className="flex items-center gap-1 text-xs">
                      <input
                        type="checkbox"
                        checked={filters.searchIn?.includes(field) || false}
                        onChange={() => handleSearchInToggle(field)}
                        className="rounded border-zinc-300 dark:border-zinc-600 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-zinc-600 dark:text-zinc-400">
                        {field === 'title' ? 'Titel' : field === 'description' ? 'Beskrivning' : field === 'note' ? 'Notering' : 'Referens'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Date Range */}
              <div>
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2 block flex items-center gap-2">
                  <Calendar size={16} className="text-indigo-500" />
                  Datumintervall
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 block">Från</label>
                    <input
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 block">Till</label>
                    <input
                      type="date"
                      value={filters.dateTo}
                      onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Type Filter */}
              <div>
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2 block">
                  Typ
                </label>
                <div className="flex flex-wrap gap-2">
                  {['all', 'income', 'expense'].map(type => (
                    <button
                      key={type}
                      onClick={() => handleFilterChange('type', type)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        filters.type === type
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                      }`}
                    >
                      {type === 'all' ? 'Alla' : type === 'income' ? 'Inkomst' : 'Utgift'}
                    </button>
                  ))}
                </div>
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
                          className="rounded border-zinc-300 dark:border-zinc-600 text-indigo-600 focus:ring-indigo-500"
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

              {/* Status Filter */}
              <div>
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2 block">
                  Status
                </label>
                <div className="flex flex-wrap gap-2">
                  {['all', 'Bokförd', 'Väntande', 'Makulerad'].map(status => (
                    <button
                      key={status}
                      onClick={() => handleFilterChange('status', status)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        filters.status === status
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                      }`}
                    >
                      {status === 'all' ? 'Alla' : status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount Range */}
              <div>
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2 block">
                  Beloppsintervall
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 block">Min belopp</label>
                    <input
                      type="number"
                      value={filters.minAmount}
                      onChange={(e) => handleFilterChange('minAmount', e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 block">Max belopp</label>
                    <input
                      type="number"
                      value={filters.maxAmount}
                      onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
                      placeholder="Ingen gräns"
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Has Receipt / Has Note */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2 block">
                    Har Kvitto
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['all', 'yes', 'no'].map(option => (
                      <button
                        key={option}
                        onClick={() => handleFilterChange('hasReceipt', option)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          filters.hasReceipt === option
                            ? 'bg-indigo-600 text-white'
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
                        onClick={() => handleFilterChange('hasNote', option)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          filters.hasNote === option
                            ? 'bg-indigo-600 text-white'
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
                    className="flex-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <button
                    onClick={handleSaveSearch}
                    disabled={isSaving || !searchName.trim() || !hasActiveFilters()}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
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
                        className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
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
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/20'
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

export default AdvancedSearchModal;

